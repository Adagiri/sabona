import { Test, TestingModule } from '@nestjs/testing';
import CustomerService from './customer.service';
import DatabaseService from '../../../database/database.service';
import NotificationService from '../notification/notification.service';
import LocationService from '../location/location.service';
import { OrderType, PaymentType, DeliveryType, UserType, UserStatus, LEVEL } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';
// import { I18nService } from 'nestjs-i18n';

// Mock helper functions
jest.mock('../../../helpers/util.helper', () => ({
    extractTokens: jest.fn().mockReturnValue(['token1', 'token2']),
    GetPaginationOptions: jest.fn().mockReturnValue({}),
}));

describe('CustomerService', () => {
    let service: CustomerService;
    let dbService: DatabaseService;
    let notificationService: NotificationService;
    let locationService: LocationService;
    let module: TestingModule;

    const mockDbService = {
        order: {
            create: jest.fn(),
            findUnique: jest.fn(),
        },
        laundry: {
            findUnique: jest.fn(),
        },
        laundryService: {
            findUnique: jest.fn(),
        },
        laundryServiceItem: {
            findUnique: jest.fn(),
        },
        deviceToken: {
            findMany: jest.fn(),
        },
        vendorOrder: {
            create: jest.fn(),
        },
        coupon: {
            findFirst: jest.fn(),
        },
        couponUsage: {
            create: jest.fn(),
            findFirst: jest.fn(),
        },
        notification: {
            create: jest.fn(),
        },
        adminSettings: {
            findFirst: jest.fn(),
            create: jest.fn(),
        },
        $disconnect: jest.fn(),
    };

    const mockNotificationService = {
        SendNotificationToMultipleTokens: jest.fn(),
    };

    const mockLocationService = {
        findClosestAvailableDriver: jest.fn(),
        calculateDistance: jest.fn().mockReturnValue(5),
    };

    const mockI18nService = {
        t: jest.fn().mockImplementation((key) => {
            // Map translation keys to expected error messages
            const translations = {
                'Laundry not found': 'Laundry not found',
                'No available drivers in your area at the moment. Please try again later.':
                    'No available drivers in your area at the moment. Please try again later.',
                'laundryId and services are required for registered laundry orders':
                    'laundryId and services are required for registered laundry orders',
                'Invalid or expired coupon': 'Invalid or expired coupon',
            };
            return translations[key] || key;
        }),
    };

    beforeEach(async () => {
        module = await Test.createTestingModule({
            providers: [
                CustomerService,
                {
                    provide: DatabaseService,
                    useValue: mockDbService,
                },
                {
                    provide: NotificationService,
                    useValue: mockNotificationService,
                },
                {
                    provide: LocationService,
                    useValue: mockLocationService,
                },
                {
                    provide: 'I18nService',
                    useValue: mockI18nService,
                },
            ],
        }).compile();

        service = module.get<CustomerService>(CustomerService);
        dbService = module.get<DatabaseService>(DatabaseService);
        notificationService = module.get<NotificationService>(NotificationService);
        locationService = module.get<LocationService>(LocationService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    afterAll(async () => {
        if (module) {
            await module.close();
        }
        await mockDbService.$disconnect();
    });

    describe('CreateOrder', () => {
        const mockUser = {
            id: '1',
            email: 'test@test.com',
            name: 'Test User',
            firstName: 'Test',
            lastName: 'User',
            password: 'hashedPassword123',
            phone: '+1234567890',
            type: UserType.USER,
            status: UserStatus.ACTIVE,
            level: LEVEL.BASIC,
            profilePictureId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
        };

        const mockOrderData = {
            orderType: OrderType.REGISTERED_LAUNDRY,
            laundryId: '123',
            services: [
                {
                    serviceId: '1',
                    items: [{ id: '1', quantity: 2 }],
                },
            ],
            pickupAddress: 'Test Address',
            pickupLat: 25.2048,
            pickupLong: 55.2708,
            pickupDate: new Date().toISOString(),
            pickupTime: '10:00',
            deliveryAddress: 'Delivery Address',
            deliveryLat: 25.2048,
            deliveryLong: 55.2708,
            deliveryDate: new Date().toISOString(),
            paymentType: PaymentType.CASH,
            deliveryType: DeliveryType.NORMAL,
            totalAmount: 100,
        };

        it('should create an order successfully', async () => {
            mockDbService.laundryService.findUnique.mockResolvedValue({
                laundryId: '123',
                name: 'Test Service',
            });

            mockDbService.laundryServiceItem.findUnique.mockResolvedValue({
                platformPrice: 10,
                name: 'Test Item',
            });

            mockDbService.laundry.findUnique.mockResolvedValue({
                id: '123',
                vendorId: 'vendor1',
                name: 'Test Laundry',
            });

            mockLocationService.findClosestAvailableDriver.mockResolvedValue({
                id: 'driver1',
            });

            mockDbService.adminSettings.findFirst.mockResolvedValue({
                vatRate: 0.15,
                vatEnabled: true,
                serviceChargeType: 'PERCENTAGE',
                serviceChargeRate: 7.0,
                customOrderServiceChargeRate: 10.0,
                deliveryBaseRate: 5.0,
                deliveryPerKmRate: 2.0,
                freeDeliveryThreshold: 100.0,
                expressMultiplier: 2.0,
                maxDeliveryDistance: 50.0,
            });

            mockDbService.deviceToken.findMany.mockResolvedValue([
                { token: 'customer-token' },
                { token: 'vendor-token' },
            ]);

            const mockCreatedOrder = {
                id: '1',
                orderNumber: 'ORD123',
                ...mockOrderData,
                subtotalAmount: 20,
                serviceCharge: 1.4,
                deliveryFee: 15,
                preDiscountAmount: 36.4,
                discountAmount: 0,
                postDiscountAmount: 36.4,
                vatAmount: 5.46,
                vatPercentage: 0.15,
                totalAmount: 41.86,
                distanceKm: 5,
                baseAmount: 20,
            };
            mockDbService.order.create.mockResolvedValue(mockCreatedOrder);

            mockDbService.vendorOrder.create.mockResolvedValue({});
            mockDbService.notification.create.mockResolvedValue({});

            const result = await service.CreateOrder(mockOrderData, mockUser);

            expect(result).toEqual({ data: mockCreatedOrder });
            expect(mockDbService.laundry.findUnique).toHaveBeenCalledWith({
                where: { id: '123' },
                select: { vendorId: true, name: true },
            });
            expect(mockLocationService.findClosestAvailableDriver).toHaveBeenCalledWith(25.2048, 55.2708);
            expect(mockDbService.order.create).toHaveBeenCalled();
            expect(mockDbService.vendorOrder.create).toHaveBeenCalled();
            expect(mockNotificationService.SendNotificationToMultipleTokens).toHaveBeenCalledTimes(3);
            expect(mockDbService.notification.create).toHaveBeenCalledTimes(3);
        });

        it('should throw error if laundry not found', async () => {
            mockDbService.laundry.findUnique.mockResolvedValue(null);

            await expect(service.CreateOrder(mockOrderData, mockUser)).rejects.toThrow('Laundry not found');
        });

        it('should throw error if no driver available', async () => {
            mockDbService.laundry.findUnique.mockResolvedValue({
                id: '123',
                vendorId: 'vendor1',
                name: 'Test Laundry',
            });
            mockLocationService.findClosestAvailableDriver.mockResolvedValue(null);

            await expect(service.CreateOrder(mockOrderData, mockUser)).rejects.toThrow(
                new BadRequestException('No available drivers in your area at the moment. Please try again later.'),
            );
        });

        it('should throw error if services are empty', async () => {
            const invalidOrderData = {
                ...mockOrderData,
                services: [],
            };

            await expect(service.CreateOrder(invalidOrderData, mockUser)).rejects.toThrow(
                new BadRequestException('laundryId and services are required for registered laundry orders'),
            );
        });

        it('should handle coupon application', async () => {
            mockDbService.laundryService.findUnique.mockResolvedValue({
                laundryId: '123',
                name: 'Test Service',
            });

            mockDbService.laundryServiceItem.findUnique.mockResolvedValue({
                platformPrice: 10,
                name: 'Test Item',
            });

            mockDbService.laundry.findUnique.mockResolvedValue({
                id: '123',
                vendorId: 'vendor1',
                name: 'Test Laundry',
            });

            mockLocationService.findClosestAvailableDriver.mockResolvedValue({
                id: 'driver1',
            });

            mockDbService.adminSettings.findFirst.mockResolvedValue({
                vatRate: 0.15,
                vatEnabled: true,
                serviceChargeType: 'PERCENTAGE',
                serviceChargeRate: 7.0,
                customOrderServiceChargeRate: 10.0,
                deliveryBaseRate: 5.0,
                deliveryPerKmRate: 2.0,
                freeDeliveryThreshold: 100.0,
                expressMultiplier: 2.0,
                maxDeliveryDistance: 50.0,
            });

            mockDbService.coupon.findFirst.mockResolvedValue({
                id: 'coupon1',
                code: 'SAVE10',
                type: 'FIXED',
                discount: 10,
                maxDiscount: null,
                minOrderAmount: 20,
                singleUse: true,
                usageLimit: null,
            });

            mockDbService.couponUsage.findFirst.mockResolvedValue(null);
            mockDbService.couponUsage.create.mockResolvedValue({});

            mockDbService.deviceToken.findMany.mockResolvedValue([
                { token: 'customer-token' },
                { token: 'vendor-token' },
            ]);

            const mockCreatedOrder = {
                id: '1',
                orderNumber: 'ORD123',
                ...mockOrderData,
                couponCode: 'SAVE10',
                subtotalAmount: 20,
                serviceCharge: 1.4,
                deliveryFee: 15,
                preDiscountAmount: 36.4,
                discountAmount: 10,
                postDiscountAmount: 26.4,
                vatAmount: 3.96,
                vatPercentage: 0.15,
                totalAmount: 30.36,
                distanceKm: 5,
                baseAmount: 20,
            };
            mockDbService.order.create.mockResolvedValue(mockCreatedOrder);

            mockDbService.vendorOrder.create.mockResolvedValue({});
            mockDbService.notification.create.mockResolvedValue({});

            const orderDataWithCoupon = {
                ...mockOrderData,
                couponCode: 'SAVE10',
            };

            const result = await service.CreateOrder(orderDataWithCoupon, mockUser);

            expect(result).toEqual({ data: mockCreatedOrder });
            expect(mockDbService.coupon.findFirst).toHaveBeenCalledWith({
                where: { code: 'SAVE10', isActive: true, expiryDate: { gte: expect.any(Date) } },
                select: {
                    id: true,
                    code: true,
                    type: true,
                    discount: true,
                    maxDiscount: true,
                    minOrderAmount: true,
                    singleUse: true,
                    usageLimit: true,
                },
            });
            expect(mockDbService.couponUsage.findFirst).toHaveBeenCalledWith({
                where: { userId: mockUser.id, couponId: 'coupon1' },
            });
            expect(mockDbService.couponUsage.create).toHaveBeenCalled();
        });
    });
});
