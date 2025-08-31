import { Injectable } from '@nestjs/common';
import DatabaseService from '../../../database/database.service';
import {
    OrderStatus,
    PaymentType,
    User,
    FeedbackType,
    CouponType,
    TipType,
    OrderType,
    DeliveryType,
} from '@prisma/client';
import CreateOrderRequestDTO from './dto/request/createOrder.request';
import AcceptOrderRequestDTO from '../vendor/dto/request/acceptOrder.request';
import CancelOrderResponseDTO from './dto/response/cancelOrder.response';
import { OrderListDto } from './dto/response/orderlist.response.dto';
import { extractTokens, GetPaginationOptions } from 'src/helpers/util.helper';
import NotificationService from '../notification/notification.service';
import CreateFeedbackDTO from './dto/request/createFeeback.request';
import CreateFeedbackResponseDTO from './dto/response/createFeedback.response';
import { BadRequestException } from 'src/core/exceptions/response.exception';
import { HasFeedBackRequestDTO } from './dto/request/hasFeedback.request';
import { HasFeedbackResponseDTO } from './dto/response/hasFeedback.response.dto';
import { ValidateCouponQueryRequestDTO, ValidateCouponRequestDTO } from './dto/request/validateCoupon.request';
import { ValidateCouponResponseDTO } from './dto/response/validateCoupon.response';
import { coupon, getUserCouponsQueryDTO } from './dto/request/getUserCoupons.request';
import { GetUserCouponsResponseDTO } from './dto/response/getUserCoupons.response';
import { CreateTipDTO } from './dto/request/createTip.request';
import { HasTippedResponseDTO } from './dto/response/hasTipped.response';
import { AddTipResponseDto } from './dto/response/addTip.response';
import LocationService from '../location/location.service';
import { DELIVERY_CHARGES } from 'src/constants';
import { CalculateFeesRequestDTO } from './dto/request/calculateFees.request';
import { CalculateFeesResponseDTO } from './dto/response/calculateFees.response';
import { BooleanResponseDTO } from 'src/core/response/response.schema';

export interface FeeCalculationInput {
    orderType: OrderType;
    subtotal: number;
    deliveryType: DeliveryType;
    pickupLat: number;
    pickupLong: number;
    deliveryLat: number;
    deliveryLong: number;
    customServiceCharge?: number;
}

export interface FeeCalculationResult {
    subtotal: number;
    serviceCharge: number;
    deliveryFee: number;
    vatAmount: number;
    total: number;
    distance: number;
    breakdown: {
        baseDeliveryFee: number;
        distanceDeliveryFee: number;
        expressMultiplier?: number;
        serviceChargeRate: number;
        vatRate: number;
    };
}

@Injectable()
export default class CustomerService {
    constructor(
        private _dbService: DatabaseService,
        private _notificationService: NotificationService,
        private _locationService: LocationService,
    ) {}

    async calculateOrderFees(data: CalculateFeesRequestDTO): Promise<CalculateFeesResponseDTO> {
        try {
            const result = await this.calculateOrderFeez({
                orderType: data.orderType,
                subtotal: data.subtotal,
                deliveryType: data.deliveryType,
                pickupLat: data.pickupLat,
                pickupLong: data.pickupLong,
                deliveryLat: data.deliveryLat,
                deliveryLong: data.deliveryLong,
                customServiceCharge: data.customServiceCharge,
            });

            return {
                data: result,
            };
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

    /**
     * Create regular order (REGISTERED_LAUNDRY only)
     * Custom orders handled by CustomOrderService
     */
    async CreateOrder(data: CreateOrderRequestDTO, user: User): Promise<any> {
        // Only handle registered laundry orders
        if (data.orderType !== OrderType.REGISTERED_LAUNDRY) {
            throw new BadRequestException(
                'This endpoint only handles registered laundry orders. Use /custom-order/create for custom orders.',
            );
        }

        // Validate required fields for regular orders
        if (!data.laundryId || !data.services || data.services.length === 0) {
            throw new BadRequestException('laundryId and services are required for registered laundry orders');
        }

        // Validate laundry exists
        const laundry = await this._dbService.laundry.findUnique({
            where: { id: data.laundryId },
            select: { vendorId: true, name: true },
        });

        if (!laundry) {
            throw new BadRequestException('Laundry not found');
        }

        // Find closest available driver
        const closestDriver = await this._locationService.findClosestAvailableDriver(
            data.pickupLat,
            data.pickupLong,
            50, // 50km max radius
        );
        if (!closestDriver) {
            throw new BadRequestException('No available drivers in your area at the moment. Please try again later.');
        }

        // Handle coupon validation if provided
        if (data.couponId) {
            await this.validateCoupon(data, user);
        }

        // Get device tokens for notifications
        const [customerDeviceTokens, vendorDeviceTokens] = await Promise.all([
            this._dbService.deviceToken.findMany({
                where: { userId: user.id, deletedAt: null },
                select: { token: true },
            }),
            this._dbService.deviceToken.findMany({
                where: { userId: laundry.vendorId, deletedAt: null },
                select: { token: true },
            }),
        ]);

        const feeCalculation = await this.calculateOrderFeez({
            orderType: data.orderType,
            subtotal: data.baseAmount || data.totalAmount,
            deliveryType: data.deliveryType,
            pickupLat: data.pickupLat,
            pickupLong: data.pickupLong,
            deliveryLat: data.deliveryLat,
            deliveryLong: data.deliveryLong,
            customServiceCharge: data.adminServiceCharge,
        });

        // Create order
        const order = await this._dbService.order.create({
            data: {
                userId: user.id,
                orderType: OrderType.REGISTERED_LAUNDRY,
                laundryId: data.laundryId,
                baseAmount: data.baseAmount || data.totalAmount,
                totalAmount: feeCalculation.total,
                discountAmount: data.discountAmount || 0,
                couponId: data.couponId,
                paymentType: data.paymentType,
                status: data.paymentType === PaymentType.CASH ? OrderStatus.PENDING : OrderStatus.PENDING_PAYMENT,
                deliveryType: data.deliveryType,
                notes: data.note,
                pickup: {
                    create: {
                        pickupAddress: data.pickupAddress,
                        pickupLat: data.pickupLat,
                        pickupLong: data.pickupLong,
                        pickupDate: data.pickupDate,
                        pickupTime: data.pickupTime,
                    },
                },
                delivery: {
                    create: {
                        deliveryAddress: data.deliveryAddress,
                        deliveryLat: data.deliveryLat,
                        deliveryLong: data.deliveryLong,
                        deliveryDate: data.deliveryDate,
                    },
                },
                services: {
                    create: data.services.map((service) => ({
                        laundryServiceId: service.serviceId,
                        items: {
                            create: service.items.map((item) => ({
                                laundryServiceItemId: item.id,
                                quantity: item.quantity,
                            })),
                        },
                    })),
                },
                serviceCharge: feeCalculation.serviceCharge,
                deliveryFee: feeCalculation.deliveryFee,
                vatAmount: feeCalculation.vatAmount,

                distanceKm: feeCalculation.distance,
            },
        });

        await this._dbService.vendorOrder.create({
            data: {
                orderId: order.id,
                vendorId: laundry.vendorId,
            },
        });


        // Extract tokens
        const customerTokens = extractTokens(customerDeviceTokens);
        const vendorTokens = extractTokens(vendorDeviceTokens);


        if (vendorTokens?.length) {
            const vendorNotificationData = {
                tokens: vendorTokens,
                title: 'New Order!',
                body: `New order #${order.orderNumber} - Please accept or reject`,
                notificationData: {
                    orderId: order.id,
                    key: 'FETCH_ORDER_REQUESTS',
                    route: 'Home',
                },
            };

            await this._notificationService.SendNotificationToMultipleTokens(vendorNotificationData);

            await this._dbService.notification.create({
                data: {
                    userId: laundry.vendorId,
                    orderId: order.id,
                    message: 'You have received a new order. Please accept or reject.',
                    status: 'UNREAD',
                    data: {
                        orderId: order.id,
                        key: 'FETCH_ORDER_REQUESTS',
                        route: 'Home',
                    },
                    type: 'ORDER_PLACED',
                },
            });
        }

        // Notify customer
        if (customerTokens?.length) {
            const customerNotificationData = {
                tokens: customerTokens,
                title: 'Order Placed',
                body: `Your order has been placed`,
                notificationData: {
                    orderId: order.id,
                    key: 'FETCH_ORDERS',
                    route: 'Orders',
                },
            };

            await this._notificationService.SendNotificationToMultipleTokens(customerNotificationData);

            await this._dbService.notification.create({
                data: {
                    userId: user.id,
                    orderId: order.id,
                    message: 'Your order has been placed and assigned to a driver.',
                    status: 'UNREAD',
                    data: {
                        orderId: order.id,
                        key: 'FETCH_ORDERS',
                        route: 'Orders',
                    },
                    type: 'ORDER_PLACED',
                },
            });
        }

        // Notify vendor
        if (vendorTokens?.length) {
            const vendorNotificationData = {
                tokens: vendorTokens,
                title: 'New Order!',
                body: `New order #${order.orderNumber} - driver assigned and on the way`,
                notificationData: {
                    orderId: order.id,
                    key: 'FETCH_ORDER_REQUESTS',
                    route: 'Home',
                },
            };

            await this._notificationService.SendNotificationToMultipleTokens(vendorNotificationData);

            await this._dbService.notification.create({
                data: {
                    userId: laundry.vendorId,
                    orderId: order.id,
                    message: 'You have received a new order.',
                    status: 'UNREAD',
                    data: {
                        orderId: order.id,
                        key: 'FETCH_ORDER_REQUESTS',
                        route: 'Home',
                    },
                    type: 'ORDER_PLACED',
                },
            });
        }

        return {
            data: order,
            assignedDriver: {
                riderId: closestDriver.riderId,
                name: `${closestDriver.firstName} ${closestDriver.lastName}`,
                distance: closestDriver.distance,
                phone: closestDriver.phone,
            },
            message: `Order created and assigned to driver ${closestDriver.distance}km away`,
        };
    }

    /**
     * Validate coupon for regular orders
     */
    private async validateCoupon(data: CreateOrderRequestDTO, user: User): Promise<void> {
        const revalidateCoupon = await this._dbService.coupon.findFirst({
            where: {
                id: data.couponId,
                isActive: true,
            },
            select: {
                singleUse: true,
                usageLimit: true,
                discount: true,
                type: true,
                minOrderAmount: true,
                maxDiscount: true,
            },
        });

        if (!revalidateCoupon) {
            throw new BadRequestException('Coupon is not valid');
        }

        const cartAmountBeforeDiscount =
            data.baseAmount! -
            (data.deliveryType === DeliveryType.EXPRESS ? DELIVERY_CHARGES.EXPRESS : DELIVERY_CHARGES.NORMAL);

        if (revalidateCoupon.minOrderAmount && cartAmountBeforeDiscount < revalidateCoupon.minOrderAmount) {
            throw new BadRequestException('Minimum order amount not met');
        }

        // Validate coupon usage
        if (revalidateCoupon.singleUse) {
            const couponUsed = await this._dbService.couponUsage.findFirst({
                where: {
                    userId: user.id,
                    couponId: data.couponId,
                },
            });

            if (couponUsed) {
                throw new BadRequestException('Coupon already used');
            }
        }

        if (revalidateCoupon.usageLimit !== null) {
            const couponUsage = await this._dbService.couponUsage.findMany({
                where: { couponId: data.couponId },
            });

            if (couponUsage.length >= revalidateCoupon.usageLimit) {
                throw new BadRequestException('Coupon limit reached');
            }
        }

        // Create coupon usage record
        await this._dbService.couponUsage.create({
            data: {
                userId: user.id,
                couponId: data.couponId,
            },
        });
    }

    async CancelOrder(params: AcceptOrderRequestDTO, user: User): Promise<CancelOrderResponseDTO> {
        const order = await this._dbService.order.findUnique({
            where: {
                id: params.orderId,
            },
            select: {
                status: true,
            },
        });

        if (!order) {
            throw new Error('Order does not exist');
        }

        const isUsersOrder = await this._dbService.order.findFirst({
            where: {
                id: params.orderId,
                userId: user.id,
            },
        });

        if (!isUsersOrder) {
            throw new BadRequestException('Order does not belong to user');
        }

        if (order.status === 'CANCELLED') {
            throw new BadRequestException('Order already cancelled');
        }

        if (order.status !== 'PENDING') {
            throw new BadRequestException('Order cannot be cancelled');
        }

        const cancelledOrder = await this._dbService.order.update({
            where: {
                id: params.orderId,
            },
            data: {
                status: 'CANCELLED',
            },
        });

        if (!cancelledOrder) {
            throw new BadRequestException('Error cancelling the order');
        }

        const orderCancelled = await this._dbService.order.findUnique({
            where: {
                id: params.orderId,
            },
            select: {
                id: true,
                status: true,
                userId: true,
            },
        });

        return orderCancelled;
    }

    async GetOrders(user: User): Promise<OrderListDto> {
        const orders = await this._dbService.order.findMany({
            where: {
                userId: user.id,
            },
            select: {
                id: true,
                status: true,
                services: {
                    select: {
                        items: {
                            select: {
                                quantity: true,
                            },
                        },
                    },
                },
                laundry: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        if (!orders) {
            throw new BadRequestException('Error fetching orders');
        }

        const ordersWithTotalQuantity = orders.map((order) => {
            const totalQuantity = order.services.reduce((orderTotal, service) => {
                const serviceTotal = service.items.reduce((itemTotal, item) => itemTotal + item.quantity, 0);
                return orderTotal + serviceTotal;
            }, 0);

            return {
                ...order,
                totalQuantity,
            };
        });

        return ordersWithTotalQuantity;
    }

    async AddFeedback(data: CreateFeedbackDTO, user: User): Promise<CreateFeedbackResponseDTO> {
        const {
            pickupRiderRating,
            deliveryRiderRating,
            vendorRating,
            orderId,
            pickupRiderFeedback,
            deliveryRiderFeedback,
            vendorFeedback,
            pickupRiderOrderId,
            deliveryRiderOrderId,
            vendorOrderId,
            laundryId,
        } = data;

        const isOrderCompleted = await this._dbService.order.findFirst({
            where: {
                id: orderId,
                status: 'COMPLETED',
            },
        });

        const createFeedback = async (rating: number | undefined, comments: string | undefined, type: FeedbackType) => {
            if (rating !== 0) {
                const res = await this._dbService.feedback.create({
                    data: {
                        userId: user.id,
                        rating,
                        comments: comments ?? '',
                        type,
                        orderId,
                        riderOrderId:
                            type === 'RIDER_PICKUP'
                                ? pickupRiderOrderId
                                : type === 'RIDER_DELIVERY'
                                  ? deliveryRiderOrderId
                                  : null,
                        vendorOrderId: type === 'VENDOR' ? vendorOrderId : null,
                        laundryId: type === 'VENDOR' ? laundryId : null,
                    },
                });
                if (res) {
                    return true;
                }
            }
        };

        if (isOrderCompleted) {
            const feedbacksCreated = await Promise.all([
                createFeedback(vendorRating, vendorFeedback, 'VENDOR'),
                createFeedback(pickupRiderRating, pickupRiderFeedback, 'RIDER_PICKUP'),
                createFeedback(deliveryRiderRating, deliveryRiderFeedback, 'RIDER_DELIVERY'),
            ]);

            if (feedbacksCreated.some((feedback) => feedback === true)) {
                return { message: 'Feedback added successfully' };
            } else {
                throw new BadRequestException('Error adding feedback');
            }
        } else {
            throw new BadRequestException('Order is not completed');
        }
    }

    async HasFeedback(params: HasFeedBackRequestDTO, user: User): Promise<HasFeedbackResponseDTO> {
        const feedback = await this._dbService.feedback.findFirst({
            where: {
                userId: user?.id,
                orderId: params.orderId,
            },
        });

        if (feedback) {
            return { hasFeedback: true };
        } else {
            return { hasFeedback: false };
        }
    }

    async ValidateCoupon(
        user: User,
        params: ValidateCouponRequestDTO,
        query: ValidateCouponQueryRequestDTO,
    ): Promise<ValidateCouponResponseDTO> {
        const coupon = await this._dbService.coupon.findFirst({
            where: {
                code: params.code.toUpperCase(),
                isActive: true,
            },
            select: {
                id: true,
                singleUse: true,
                name: true,
                type: true,
                discount: true,
                minOrderAmount: true,
                code: true,
                maxDiscount: true,
                usageLimit: true,
            },
        });

        if (!coupon) {
            throw new BadRequestException('Invalid coupon');
        }

        if (coupon.singleUse) {
            const couponUsed = await this._dbService.couponUsage.findFirst({
                where: {
                    userId: user.id,
                    couponId: coupon.id,
                },
            });

            if (couponUsed) {
                throw new BadRequestException('Coupon already used');
            }
        }

        if (coupon.usageLimit) {
            const couponUsage = await this._dbService.couponUsage.findMany({
                where: {
                    couponId: coupon.id,
                },
            });

            if (couponUsage.length >= coupon.usageLimit) {
                throw new BadRequestException('Coupon limit reached');
            }
        }

        if (coupon.type === CouponType.FIXED && !query.cartAmount) {
            throw new BadRequestException('Cart amount required for fixed coupon');
        }

        if (coupon.minOrderAmount && query.cartAmount < coupon.minOrderAmount) {
            throw new BadRequestException(
                `Minimum order amount should be ${coupon.minOrderAmount}SAR to use the ${coupon.code} coupon`,
            );
        }
        if (coupon.type === CouponType.FIXED && query.cartAmount < coupon.discount) {
            throw new BadRequestException(
                `Minimum cart amount should be ${coupon.discount}SAR to use the ${coupon.code} coupon`,
            );
        }

        return coupon;
    }

    async getUserCoupons(user: User, query: getUserCouponsQueryDTO): Promise<GetUserCouponsResponseDTO> {
        switch (query.couponFilter) {
            case coupon.ACTIVE: {
                const pagination = GetPaginationOptions(query);
                const coupons = await this._dbService.coupon.findMany({
                    where: {
                        isActive: true,
                    },
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        type: true,
                        discount: true,
                        minOrderAmount: true,
                        maxDiscount: true,
                        singleUse: true,
                        usageLimit: true,
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                });
                const couponsPaginated = await this._dbService.coupon.findMany({
                    where: {
                        isActive: true,
                    },
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        type: true,
                        discount: true,
                        minOrderAmount: true,
                        maxDiscount: true,
                        singleUse: true,
                        usageLimit: true,
                    },
                    ...pagination,
                    orderBy: {
                        createdAt: 'desc',
                    },
                });
                const data = {
                    totalCoupons: coupons.length,
                    vouchers: couponsPaginated,
                };
                return data;
            }

            case coupon.USED: {
                const pagination = GetPaginationOptions(query);
                const usedCoupons = await this._dbService.couponUsage.findMany({
                    where: {
                        userId: user.id,
                    },
                    select: {
                        coupon: {
                            select: {
                                id: true,
                                name: true,
                                code: true,
                                type: true,
                                discount: true,
                                minOrderAmount: true,
                                maxDiscount: true,
                                singleUse: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                    distinct: ['couponId'],
                });

                const usedCouponsPaginated = await this._dbService.couponUsage.findMany({
                    where: {
                        userId: user.id,
                    },
                    select: {
                        coupon: {
                            select: {
                                id: true,
                                name: true,
                                code: true,
                                type: true,
                                discount: true,
                                minOrderAmount: true,
                                maxDiscount: true,
                                singleUse: true,
                            },
                        },
                    },
                    distinct: ['couponId'],
                    orderBy: {
                        createdAt: 'desc',
                    },
                    ...pagination,
                });

                const flattenCoupons = (coupons) =>
                    coupons.map((couponUsage) => ({
                        ...couponUsage.coupon, // Spread coupon properties
                    }));

                const data = {
                    totalCoupons: usedCoupons.length,
                    vouchers: flattenCoupons(usedCouponsPaginated),
                };
                return data;
            }

            case coupon.EXPIRED: {
                const pagination = GetPaginationOptions(query);
                const expiredCoupons = await this._dbService.couponUsage.findMany({
                    where: {
                        userId: user.id,
                        coupon: {
                            expiryDate: {
                                lt: new Date(),
                            },
                        },
                    },
                    select: {
                        coupon: {
                            select: {
                                id: true,
                                name: true,
                                code: true,
                                type: true,
                                discount: true,
                                minOrderAmount: true,
                                maxDiscount: true,
                            },
                        },
                    },
                    distinct: ['couponId'],
                });
                const expiredCouponsPaginated = await this._dbService.couponUsage.findMany({
                    where: {
                        userId: user.id,
                        coupon: {
                            expiryDate: {
                                lt: new Date(),
                            },
                        },
                    },
                    select: {
                        coupon: {
                            select: {
                                id: true,
                                name: true,
                                code: true,
                                type: true,
                                discount: true,
                                minOrderAmount: true,
                                maxDiscount: true,
                            },
                        },
                    },
                    distinct: ['couponId'],
                    ...pagination,
                });
                const flattenCoupons = (coupons) =>
                    coupons.map((couponUsage) => ({
                        ...couponUsage.coupon, // Spread coupon properties
                    }));

                const data = {
                    totalCoupons: expiredCoupons.length,
                    vouchers: flattenCoupons(expiredCouponsPaginated),
                };
                return data;
            }
        }
    }

    async AddTip(data: CreateTipDTO, user: User): Promise<AddTipResponseDto> {
        const order = await this._dbService.order.findFirst({
            where: {
                id: data.orderId,
                userId: user.id,
            },
            select: {
                id: true,
                status: true,
                totalAmount: true,
            },
        });

        if (!order) {
            throw new BadRequestException('Order not found');
        }

        if (order.status !== 'COMPLETED') {
            throw new BadRequestException('Order not completed');
        }

        const createTip = async (riderId: string | null, amount: number, type: TipType) => {
            if (!riderId) return null;
            return await this._dbService.tip.create({
                data: {
                    orderId: data.orderId,
                    userId: user.id,
                    riderId,
                    amount,
                    type,
                },
                select: {
                    id: true,
                },
            });
            // if (tip) {
            //     return true
            // }
        };

        const [pickupTip, deliveryTip] = await Promise.all([
            createTip(data.pickupRiderId, data.pickupRiderAmount, TipType.RIDER_PICKUP),
            createTip(data.deliveryRiderId, data.deliveryRiderAmount, TipType.RIDER_DELIVERY),
        ]);

        const createdTips = [pickupTip, deliveryTip].filter(Boolean);

        if (createdTips.length > 0) {
            // Create Tip Transaction
            const tipTransaction = await this._dbService.tipTransaction.create({
                data: {
                    amount: (data.pickupRiderAmount ?? 0) + (data.deliveryRiderAmount ?? 0),
                },
                select: {
                    id: true,
                    amount: true,
                },
            });

            if (!tipTransaction) {
                throw new BadRequestException('Error adding tip');
            }

            // Update tips with transaction ID
            await this._dbService.tip.updateMany({
                where: {
                    id: { in: createdTips.map((tip) => tip.id) },
                },
                data: {
                    transactionId: tipTransaction.id,
                },
            });

            const res = {
                transactionId: tipTransaction.id,
                amount: tipTransaction.amount,
            };

            return { data: res };
        } else {
            throw new BadRequestException('Error adding feedback');
        }
    }

    async HasTipped(params: HasFeedBackRequestDTO, user: User): Promise<HasTippedResponseDTO> {
        const tip = await this._dbService.tip.findFirst({
            where: {
                userId: user.id,
                orderId: params.orderId,
                paid: true,
            },
        });
        if (tip) {
            return { hasTipped: true };
        } else {
            return { hasTipped: false };
        }
    }

    private async calculateOrderFeez(input: FeeCalculationInput): Promise<FeeCalculationResult> {
        const settings = await this.getAdminSettings();

        // Calculate distance
        const distance = this._locationService['calculateDistance'](
            input.pickupLat,
            input.pickupLong,
            input.deliveryLat,
            input.deliveryLong,
        );

        if (distance > settings.maxDeliveryDistance) {
            throw new Error(
                `Delivery distance (${distance}km) exceeds maximum allowed distance (${settings.maxDeliveryDistance}km)`,
            );
        }

        // Calculate service charge
        const serviceCharge = this.calculateServiceCharge(input, settings);

        // Calculate delivery fee
        const deliveryFee = this.calculateDeliveryFee(input, distance, settings);

        // Calculate subtotal after service charge and delivery
        const subtotalWithFees = input.subtotal + serviceCharge + deliveryFee;

        // Calculate VAT on total (including service charge and delivery)
        const vatAmount = settings.vatEnabled ? Math.round(subtotalWithFees * settings.vatRate * 100) / 100 : 0;

        const total = subtotalWithFees + vatAmount;

        return {
            subtotal: input.subtotal,
            serviceCharge,
            deliveryFee,
            vatAmount,
            total,
            distance,
            breakdown: {
                baseDeliveryFee: settings.deliveryBaseRate,
                distanceDeliveryFee: distance * settings.deliveryPerKmRate,
                expressMultiplier: input.deliveryType === 'EXPRESS' ? settings.expressMultiplier : undefined,
                serviceChargeRate:
                    settings.serviceChargeType === 'PERCENTAGE'
                        ? settings.serviceChargeRate
                        : settings.serviceChargeRate,
                vatRate: settings.vatRate,
            },
        };
    }

    private calculateServiceCharge(input: FeeCalculationInput, settings: any): number {
        // Custom orders use admin-set service charge if provided
        if (input.orderType === OrderType.CUSTOM_LAUNDRY && input.customServiceCharge) {
            return input.customServiceCharge;
        }

        // Regular service charge calculation
        const rate =
            input.orderType === OrderType.CUSTOM_LAUNDRY
                ? settings.customOrderServiceChargeRate
                : settings.serviceChargeRate;

        if (settings.serviceChargeType === 'PERCENTAGE') {
            return Math.round(input.subtotal * (rate / 100) * 100) / 100;
        } else {
            return rate; // Fixed amount
        }
    }

    private calculateDeliveryFee(input: FeeCalculationInput, distance: number, settings: any): number {
        // Check if order qualifies for free delivery
        if (input.subtotal >= settings.freeDeliveryThreshold) {
            return 0;
        }

        let deliveryFee = settings.deliveryBaseRate + distance * settings.deliveryPerKmRate;

        // Apply express multiplier if needed
        if (input.deliveryType === 'EXPRESS') {
            deliveryFee *= settings.expressMultiplier;
        }

        return Math.round(deliveryFee * 100) / 100;
    }
    private async getAdminSettings() {
        try {
            let settings = await this._dbService.adminSettings.findFirst({
                where: {
                    deletedAt: null, 
                },
            });

            if (!settings) {
                // Create default settings if none exist
                settings = await this._dbService.adminSettings.create({
                    data: {
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
                    },
                });
            }

            return settings;
        } catch (error) {
            console.error('Error in getAdminSettings:', error);
            throw new BadRequestException('Failed to retrieve or create admin settings');
        }
    }

    async deleteMyAccount(user: User): Promise<BooleanResponseDTO> {
        // Check for active orders
        const activeOrders = await this._dbService.order.count({
            where: {
                userId: user.id,
                status: {
                    in: ['PENDING', 'PENDING_PAYMENT', 'ACCEPTED', 'IN_PROGRESS', 'READY_FOR_PICKUP'],
                },
            },
        });

        if (activeOrders > 0) {
            throw new BadRequestException('Cannot delete account with active orders');
        }

        // Soft delete using existing middleware
        await this._dbService.user.delete({
            where: { id: user.id },
        });

        return { data: true };
    }
}
