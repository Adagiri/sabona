import { Test, TestingModule } from '@nestjs/testing';
import CustomerController from './customer.controller';
import CustomerService from './customer.service';
import CustomOrderService from '../customOrder/customOrder.service';
import { DeliveryType, LEVEL, OrderType, PaymentType, UserStatus, UserType } from '@prisma/client';
import CreateOrderRequestDTO from './dto/request/createOrder.request';
import { I18nService } from 'nestjs-i18n';

describe('CustomerController', () => {
    let controller: CustomerController;
    let customerService: CustomerService;
    let module: TestingModule | undefined; // Allow undefined to handle initialization errors

    const mockCustomerService = {
        CreateOrder: jest.fn(),
    };

    const mockCustomOrderService = {};

    const mockI18nService = {
        t: jest.fn().mockImplementation((key) => {
            // Map translation keys to expected error messages
            const translations = {
                'Use /custom-order/create for custom orders': 'Use /custom-order/create for custom orders',
            };
            return translations[key] || key;
        }),
    };

    beforeEach(async () => {
        try {
            module = await Test.createTestingModule({
                controllers: [CustomerController],
                providers: [
                    {
                        provide: CustomerService,
                        useValue: mockCustomerService,
                    },
                    {
                        provide: CustomOrderService,
                        useValue: mockCustomOrderService,
                    },
                    {
                        provide: I18nService, // Use the class as the token
                        useValue: mockI18nService,
                    },
                ],
            }).compile();

            controller = module.get<CustomerController>(CustomerController);
            customerService = module.get<CustomerService>(CustomerService);
        } catch (error) {
            console.error('Failed to create testing module:', error);
            throw error;
        }
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    afterAll(async () => {
        if (module) {
            await module.close();
        }
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

        const mockOrderData: CreateOrderRequestDTO = {
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
            totalAmount: 100,
            paymentType: PaymentType.CASH,
            deliveryType: DeliveryType.NORMAL,
        };

        it('should create an order successfully', async () => {
            const expectedResult = {
                data: { id: '1', ...mockOrderData },
            };

            mockCustomerService.CreateOrder.mockResolvedValue(expectedResult);

            const result = await controller.CreateOrder(mockOrderData, mockUser);

            expect(result).toEqual(expectedResult);
            expect(customerService.CreateOrder).toHaveBeenCalledWith(mockOrderData, mockUser);
        });

        it('should throw BadRequestException for non-REGISTERED_LAUNDRY order type', async () => {
            const invalidOrderData: CreateOrderRequestDTO = {
                ...mockOrderData,
                orderType: OrderType.CUSTOM_LAUNDRY,
            };

            await expect(controller.CreateOrder(invalidOrderData, mockUser)).rejects.toThrow(
                'Use /custom-order/create for custom orders',
            );
        });
    });
});
