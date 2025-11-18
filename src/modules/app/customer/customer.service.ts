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
    ServiceChargeType,
    PaymentStatus,
} from '@prisma/client';
import CreateOrderRequestDTO from './dto/request/createOrder.request';
import AcceptOrderRequestDTO from '../vendor/dto/request/acceptOrder.request';
import CancelOrderResponseDTO from './dto/response/cancelOrder.response';
import { OrderListDto } from './dto/response/orderlist.response.dto';
import { GetPaginationOptions } from '../../../helpers/util.helper';
import CreateFeedbackDTO from './dto/request/createFeeback.request';
import CreateFeedbackResponseDTO from './dto/response/createFeedback.response';
import { BadRequestException } from '../../../core/exceptions/response.exception';
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
import { CalculateFeesRequestDTO } from './dto/request/calculateFees.request';
import { CalculateFeesResponseDTO } from './dto/response/calculateFees.response';
import { BooleanResponseDTO } from '../../../core/response/response.schema';
// import { BooleanResponseDTO } from 'src/core/response/response.schema';

export interface FeeCalculationInput {
    orderType: OrderType;
    subtotal: number;
    deliveryType: DeliveryType;
    pickupLat: number;
    pickupLong: number;
    deliveryLat: number;
    deliveryLong: number;
    customServiceCharge?: number;
    couponCode?: string;
    userId?: string;
}

@Injectable()
export default class CustomerService {
    constructor(
        private _dbService: DatabaseService,
        private _locationService: LocationService,
    ) {}

    async calculateOrderFees(data: CalculateFeesRequestDTO, userId?: string): Promise<CalculateFeesResponseDTO> {
        try {
            let itemsTotal = 0;

            if (data.orderType === OrderType.REGISTERED_LAUNDRY) {
                if (!data.services || data.services.length === 0) {
                    throw new BadRequestException('Services with items are required for registered laundry orders');
                }

                itemsTotal = await this.calculateSubtotalFromServices(data.services, data.deliveryType);
            } else if (data.orderType === OrderType.CUSTOM_LAUNDRY) {
                if (!data.customOrderAmount) {
                    throw new BadRequestException('Custom order amount is required for custom laundry orders');
                }
                itemsTotal = data.customOrderAmount;
            } else {
                throw new BadRequestException('Invalid order type');
            }

            const result = await this.calculateOrderFeez({
                orderType: data.orderType,
                subtotal: itemsTotal,
                deliveryType: data.deliveryType,
                pickupLat: data.pickupLat,
                pickupLong: data.pickupLong,
                deliveryLat: data.deliveryLat,
                deliveryLong: data.deliveryLong,
                customServiceCharge: data.customServiceCharge,
                couponCode: data.couponCode,
                userId: userId,
            });

            return result;
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

    private async calculateSubtotalFromServices(
        services: Array<{ serviceId: string; items: Array<{ id: string; quantity: number }> }>,
        deliveryType?: DeliveryType,
    ): Promise<number> {
        let subtotal = 0;
        const laundryIds = new Set<string>();

        for (const service of services) {
            const laundryService = await this._dbService.laundryService.findUnique({
                where: { id: service.serviceId },
                select: { laundryId: true, name: true },
            });

            if (!laundryService) {
                throw new BadRequestException(`Service with ID ${service.serviceId} not found`);
            }

            laundryIds.add(laundryService.laundryId);

            for (const item of service.items) {
                const serviceItem = await this._dbService.laundryServiceItem.findUnique({
                    where: {
                        id: item.id,
                        laundryServiceId: service.serviceId,
                    },
                    select: {
                        platformPrice: true,
                        expressPrice: true,
                        name: true,
                    },
                });

                if (!serviceItem) {
                    throw new BadRequestException(
                        `Service item with ID ${item.id} not found or doesn't belong to service ${service.serviceId}`,
                    );
                }

                // Choose price based on delivery type
                const priceToUse =
                    deliveryType === DeliveryType.EXPRESS ? serviceItem.expressPrice : serviceItem.platformPrice;

                subtotal += priceToUse * item.quantity;
            }
        }

        if (laundryIds.size > 1) {
            throw new BadRequestException('All service items must belong to the same laundry');
        }

        return Math.round(subtotal * 100) / 100;
    }

    private async applyCouponDiscount(
        couponCode: string,
        preDiscountAmount: number,
        userId: string,
    ): Promise<{ discountAmount: number; couponCode: string }> {
        const coupon = await this._dbService.coupon.findFirst({
            where: {
                code: couponCode.toUpperCase(),
                isActive: true,
                expiryDate: { gte: new Date() },
            },
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

        if (!coupon) {
            throw new BadRequestException('Invalid or expired coupon');
        }

        // Check minimum order amount
        if (coupon.minOrderAmount && preDiscountAmount < coupon.minOrderAmount) {
            throw new BadRequestException(`Minimum order amount of ${coupon.minOrderAmount} SAR not met`);
        }

        // Check single use
        if (coupon.singleUse) {
            const existingUsage = await this._dbService.couponUsage.findFirst({
                where: { userId, couponId: coupon.id },
            });
            if (existingUsage) {
                throw new BadRequestException('Coupon already used');
            }
        }

        // Check usage limit
        if (coupon.usageLimit) {
            const totalUsage = await this._dbService.couponUsage.count({
                where: { couponId: coupon.id },
            });
            if (totalUsage >= coupon.usageLimit) {
                throw new BadRequestException('Coupon usage limit reached');
            }
        }

        // Calculate discount
        let discountAmount = 0;
        if (coupon.type === CouponType.PERCENTAGE) {
            discountAmount = preDiscountAmount * (coupon.discount / 100);
            if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
                discountAmount = coupon.maxDiscount;
            }
        } else {
            discountAmount = Math.min(coupon.discount, preDiscountAmount);
        }

        return {
            discountAmount: Math.round(discountAmount * 100) / 100,
            couponCode: coupon.code,
        };
    }

    /**
     * Create regular order (REGISTERED_LAUNDRY only)
     * Custom orders handled by CustomOrderService
     */
    async CreateOrder(data: CreateOrderRequestDTO, user: User): Promise<any> {
        if (data.orderType !== OrderType.REGISTERED_LAUNDRY) {
            throw new BadRequestException(
                'This endpoint only handles registered laundry orders. Use /custom-order/create for custom orders.',
            );
        }

        if (!data.laundryId || !data.services || data.services.length === 0) {
            throw new BadRequestException('laundryId and services are required for registered laundry orders');
        }

        const laundry = await this._dbService.laundry.findUnique({
            where: { id: data.laundryId },
            select: { vendorId: true, name: true },
        });

        if (!laundry) {
            throw new BadRequestException('Laundry not found');
        }

        // Find closest available driver
        const closestDriver = await this._locationService.findClosestAvailableDriver(data.pickupLat, data.pickupLong);
        if (!closestDriver) {
            throw new BadRequestException('No available drivers in your area at the moment. Please try again later.');
        }

        const subtotal = await this.calculateSubtotalFromServices(data.services, data.deliveryType);

        // Calculate fees using the new system (includes coupon validation)
        const feeCalculation = await this.calculateOrderFeez({
            subtotal: subtotal,
            orderType: data.orderType,
            deliveryType: data.deliveryType,
            pickupLat: data.pickupLat,
            pickupLong: data.pickupLong,
            deliveryLat: data.deliveryLat,
            deliveryLong: data.deliveryLong,
            couponCode: data.couponCode,
            customServiceCharge: data.adminServiceCharge,
            userId: user.id,
        });

        const feeData = feeCalculation.data;

        const itemPricesMap = new Map();

        for (const service of data.services) {
            for (const item of service.items) {
                const itemData = await this._dbService.laundryServiceItem.findUnique({
                    where: { id: item.id },
                    select: {
                        vendorPrice: true,
                        platformPrice: true,
                        expressPrice: true,
                        name: true,
                        laundryService: {
                            select: { name: true },
                        },
                    },
                });

                if (!itemData) {
                    throw new BadRequestException(`Item ${item.id} not found`);
                }

                itemPricesMap.set(item.id, {
                    vendorPrice: itemData.vendorPrice,
                    platformPrice: itemData.platformPrice,
                    expressPrice: itemData.expressPrice,
                    itemName: itemData.name,
                    serviceName: itemData.laundryService.name,
                });
            }
        }

        // Create coupon usage record if coupon was applied
        let couponId: string | undefined;
        if (data.couponCode && feeData.discountAmount > 0) {
            const coupon = await this._dbService.coupon.findFirst({
                where: { code: data.couponCode.toUpperCase() },
                select: { id: true },
            });

            if (coupon) {
                couponId = coupon.id;
                // Create usage record
                await this._dbService.couponUsage.create({
                    data: {
                        userId: user.id,
                        couponId: coupon.id,
                    },
                });
            }
        }

        // Create order with detailed fee breakdown
        const order = await this._dbService.order.create({
            data: {
                userId: user.id,
                orderType: OrderType.REGISTERED_LAUNDRY,
                laundryId: data.laundryId,

                // Detailed fee breakdown
                subtotalAmount: feeData.subtotal,
                serviceCharge: feeData.serviceCharge,
                deliveryFee: feeData.deliveryFee,
                preDiscountAmount: feeData.preDiscountAmount,
                discountAmount: feeData.discountAmount,
                postDiscountAmount: feeData.postDiscountAmount,
                vatAmount: feeData.vatFee,
                vatPercentage: feeData.vatPercentage / 100, // Store as decimal
                totalAmount: feeData.finalAmount,
                distanceKm: feeData.breakdown.distance,

                // Legacy fields for backward compatibility
                baseAmount: feeData.subtotal,

                // Coupon
                couponId: couponId,

                // Order details
                paymentType: data.paymentType,
                status: data.paymentType === PaymentType.CASH ? OrderStatus.PENDING : OrderStatus.PENDING_PAYMENT,
                deliveryType: data.deliveryType,

                // Create related records
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
                            create: service.items.map((item) => {
                                const priceSnapshot = itemPricesMap.get(item.id);

                                return {
                                    laundryServiceItemId: item.id,
                                    quantity: item.quantity,
                                    vendorPriceSnapshot: priceSnapshot.vendorPrice,
                                    platformPriceSnapshot: priceSnapshot.platformPrice,
                                    expressPriceSnapshot: priceSnapshot.expressPrice,
                                    itemName: priceSnapshot.itemName,
                                    serviceName: priceSnapshot.serviceName,
                                };
                            }),
                        },
                    })),
                },
            },
        });

        return {
            data: order,
        };
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
                paymentStatus: PaymentStatus.COMPLETED,
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
                return { message: 'feedback.added_successfully' };
            } else {
                throw new BadRequestException('feedback.error_adding');
            }
        } else {
            throw new BadRequestException('order.not_completed');
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
            throw new BadRequestException('coupon.invalid');
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

    private async calculateOrderFeez(input: FeeCalculationInput): Promise<CalculateFeesResponseDTO> {
        const settings = await this.getAdminSettings();

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

        const serviceCharge = this.calculateServiceCharge(input, settings);

        const deliveryFee = this.calculateDeliveryFee(input, distance, settings);

        const preDiscountAmount = input.subtotal + serviceCharge + deliveryFee;

        let discountAmount = 0;
        let couponCode: string | undefined;

        if (input.couponCode && input.userId) {
            const couponResult = await this.applyCouponDiscount(input.couponCode, preDiscountAmount, input.userId);
            discountAmount = couponResult.discountAmount;
            couponCode = couponResult.couponCode;
        }

        const postDiscountAmount = preDiscountAmount - discountAmount;

        const vatPercentage = settings.vatRate * 100;
        const vatFee = settings.vatEnabled
            ? Math.round((deliveryFee + serviceCharge) * settings.vatRate * 100) / 100
            : 0;

        // Calculate final total
        const finalAmount = postDiscountAmount + vatFee;

        return {
            data: {
                subtotal: input.subtotal,
                serviceCharge,
                deliveryFee,
                couponCode,
                discountAmount,
                preDiscountAmount,
                postDiscountAmount,
                vatFee,
                vatPercentage,
                finalAmount,
                breakdown: {
                    baseDeliveryFee: settings.deliveryBaseRate,
                    distanceDeliveryFee: distance * settings.deliveryPerKmRate,
                    distance,
                    expressMultiplier:
                        input.deliveryType === DeliveryType.EXPRESS ? settings.expressMultiplier : undefined,
                    serviceChargeRate:
                        settings.serviceChargeType === ServiceChargeType.PERCENTAGE
                            ? settings.serviceChargeRate
                            : settings.serviceChargeRate,
                    serviceChargeType: settings.serviceChargeType,
                    vatRate: settings.vatRate,
                },
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

        if (settings.serviceChargeType === ServiceChargeType.PERCENTAGE) {
            return Math.round(input.subtotal * (rate / 100) * 100) / 100;
        } else {
            return rate; // Fixed amount
        }
    }

    private calculateDeliveryFee(input: FeeCalculationInput, distance: number, settings: any): number {
        if (input.subtotal >= settings.freeDeliveryThreshold) {
            return 0;
        }

        // let deliveryFee = settings.deliveryBaseRate + distance * settings.deliveryPerKmRate;
        let deliveryFee = 0;

        if (input.deliveryType === DeliveryType.EXPRESS) {
            deliveryFee = 9.75;
            // deliveryFee *= settings.expressMultiplier;
        }

        if (input.deliveryType === DeliveryType.NORMAL) {
            deliveryFee = 6.75;
            // deliveryFee *= settings.expressMultiplier;
        }

        return deliveryFee;
        // return Number((Math.round(deliveryFee * 100) / 100).toFixed(2));
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
