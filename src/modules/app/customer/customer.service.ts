import { Injectable } from '@nestjs/common';
import DatabaseService from '../../../database/database.service';
import { OrderStatus, PaymentType, User, FeedbackType, CouponType, DeliveryType } from '@prisma/client';
import CreateOrderRequestDTO from './dto/request/createOrder.request';
import AcceptOrderRequestDTO from '../vendor/dto/request/acceptOrder.request';
import CancelOrderResponseDTO from './dto/response/cancelOrder.response';
import { OrderListDto } from './dto/response/orderlist.response.dto';
import { extractTokens, GetPaginationOptions } from 'src/helpers/util.helper';
import NotificationService from '../notification/notification.service';
import { MultipleDeviceNotificationDto } from '../notification/dto/request/notification.request';
import CreateFeedbackDTO from './dto/request/createFeeback.request';
import CreateFeedbackResponseDTO from './dto/response/createFeedback.response';
import { BadRequestException } from 'src/core/exceptions/response.exception';
import { HasFeedBackRequestDTO } from './dto/request/hasFeedback.request';
import { HasFeedbackResponseDTO } from './dto/response/hasFeedback.response.dto';
import { ValidateCouponQueryRequestDTO, ValidateCouponRequestDTO } from './dto/request/validateCoupon.request';
import { ValidateCouponResponseDTO } from './dto/response/validateCoupon.response';
import { DELIVERY_CHARGES, SERVICE_CHARGES } from 'src/constants';
import { coupon, getUserCouponsQueryDTO } from './dto/request/getUserCoupons.request';
import { GetUserCouponsResponseDTO } from './dto/response/getUserCoupons.response';

@Injectable()
export default class CustomerService {
    constructor(
        private _dbService: DatabaseService,
        private _notificationService: NotificationService,
    ) { }

    async CreateOrder(data: CreateOrderRequestDTO, user: User): Promise<any> {
        // Fetch customer device tokens
        const customerDeviceTokensPromise = this._dbService.deviceToken.findMany({
            where: {
                userId: user.id,
                deletedAt: null,
            },
            select: {
                token: true,
            },
        });

        const vendorId = await this._dbService.laundry.findMany({
            where: {
                id: data.laundryId,
            },
            select: {
                vendorId: true,
            }

        });

        const vendorsDeviceTokensPromise = await this._dbService.deviceToken.findMany({
            where: {
                userId: vendorId[0].vendorId,
                deletedAt: null,
            },
            select: {
                token: true,
            },
        });

        if (data.couponId){  
            const revalidateCoupon = await this._dbService.coupon.findFirst({
                where: {
                    id: data.couponId,
                    isActive: true,
                },
                select:{
                    singleUse: true,
                    usageLimit:true,
                    discount:true,
                    type:true,
                    minOrderAmount:true,
                    maxDiscount:true,
                }
            })
            if (!revalidateCoupon) {
                throw new BadRequestException("Coupon is not valid");
            }
            const cartAmountBeforeDiscount = data.baseAmount - (data.deliveryType === DeliveryType.EXPRESS ?  DELIVERY_CHARGES.EXPRESS : DELIVERY_CHARGES.NORMAL) - SERVICE_CHARGES;

            if (revalidateCoupon.minOrderAmount && cartAmountBeforeDiscount < revalidateCoupon.minOrderAmount) {
                throw new BadRequestException("Minimum order amount not met");
            }

            if (revalidateCoupon.type === CouponType.FIXED) {
                if (data.totalAmount !== data.baseAmount - revalidateCoupon.discount){
                    throw new BadRequestException("Invalid amount calculation");
                }
            } else if (revalidateCoupon.type === CouponType.PERCENTAGE) {
                const baseDiscount = cartAmountBeforeDiscount * revalidateCoupon.discount / 100;

                // Apply the maximum discount cap if it's defined
                const cappedDiscount = revalidateCoupon.maxDiscount 
                    ? Math.min(baseDiscount, revalidateCoupon.maxDiscount) 
                    : baseDiscount;
                
                // Calculate the total discount
                const discount = cartAmountBeforeDiscount - cappedDiscount;
                
                // Validate the total amount
                const expectedTotalAmount = discount + 
                    (data.deliveryType === DeliveryType.EXPRESS ? DELIVERY_CHARGES.EXPRESS : DELIVERY_CHARGES.NORMAL) + 
                    SERVICE_CHARGES;
                
                if (data.totalAmount !== expectedTotalAmount) {
                    throw new BadRequestException("Invalid amount calculation");
                }

            }
            
            if (revalidateCoupon.singleUse){
                const couponUsed = await this._dbService.couponUsage.findFirst({
                    where: {
                        userId: user.id,
                        couponId: data.couponId,
                    }
                });
    
                if (couponUsed) {
                    throw new BadRequestException("Coupon already used");
                }
            }

            if (revalidateCoupon.usageLimit !== null){
                const couponUsage = await this._dbService.couponUsage.findMany({
                    where: {
                        couponId: data.couponId,
                    }
                });

                if (couponUsage.length >= revalidateCoupon.usageLimit){
                    throw new BadRequestException("Coupon limit reached");
                }
            }

            const couponUsed = await this._dbService.couponUsage.create({
                data: {
                    userId: user.id,
                    couponId: data.couponId,
                }
            });
            if (!couponUsed) {
                throw new BadRequestException("Error using coupon");
            }
            
        }

        // Create the order
        const orderPromise = this._dbService.order.create({
            data: {
                userId: user.id,
                laundryId: data.laundryId,
                totalAmount: data.totalAmount,
                notes: data.note,
                paymentType: data.paymentType,
                baseAmount: data.baseAmount ? data.baseAmount : data.totalAmount,
                discountAmount: data.discountAmount ? data.discountAmount : 0,
                couponId: data.couponId,
                status: data.paymentType === PaymentType.CASH ? OrderStatus.PENDING : OrderStatus?.PENDING_PAYMENT,
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
                deliveryType: data.deliveryType,
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
            },
        });

        // Execute promises in parallel
        const [customerDeviceTokens, vendorsDeviceTokens, order] = await Promise.all([customerDeviceTokensPromise, vendorsDeviceTokensPromise, orderPromise]);

        // Extract Customer tokens
        const customserTokens = extractTokens(customerDeviceTokens);

        // Extract Vendor tokens
        const vendorTokens = extractTokens(vendorsDeviceTokens);

        // Send Customer notification Data
        const customerNotificationData: MultipleDeviceNotificationDto = {
            tokens: customserTokens,
            title: "Order Placed!!",
            body: "Your order has been placed successfully.",
            notificationData: {
                orderId: order.id,
                key: 'FETCH_ORDERS',
                route: 'Orders',
            },

        };

        // Send Vendor notification Data
        const vendorNotificationData: MultipleDeviceNotificationDto = {
            tokens: vendorTokens,
            title: "New Order!!",
            body: "You have recieved a new order.",
            notificationData: {
                orderId: order.id,
                key: 'FETCH_ORDER_REQUESTS',
                route: 'Home',
            }
        };

        if (customserTokens?.length) {
            const res = await this._notificationService.SendNotificationToMultipleTokens(customerNotificationData);
            if (res) {
                const createNotification = await this._dbService.notification.create({
                    data: {
                        userId: user.id,
                        orderId: order.id,
                        message: "Your order has been placed successfully.",
                        status: "UNREAD",
                        data: {
                            orderId: order.id,
                            key: 'FETCH_ORDERS',
                            route: 'Orders',
                        },
                        type: "ORDER_PLACED",
                    }
                });
                if (createNotification) {
                    console.log("Customer Notification created successfully");
                }
                else {
                    console.log("Error creating notification");
                }

            }
        }
        else {
            console.log("No customer tokens found");
        }
        if (vendorTokens?.length) {
            const res = await this._notificationService.SendNotificationToMultipleTokens(vendorNotificationData);
            if (res) {
                const createNotification = await this._dbService.notification.create({
                    data: {
                        userId: vendorId[0].vendorId,
                        orderId: order.id,
                        message: "You have recieved a new order.",
                        status: "UNREAD",
                        data: {
                            orderId: order.id,
                            key: 'FETCH_ORDER_REQUESTS',
                            route: 'Home',
                        },
                        type: "ORDER_PLACED",
                    }
                });
                if (createNotification) {
                    console.log("Vendor Notification created successfully");
                }
                else {
                    console.log("Error creating notification");
                }
            }
        } else {
            console.log("No vendor tokens found");
        }


        if (!order) {
            throw new BadRequestException("Error creating order");
        }

        return { data: order };
    }



    async CancelOrder(params: AcceptOrderRequestDTO, user: User): Promise<CancelOrderResponseDTO> {
        const order = await this._dbService.order.findUnique({
            where: {
                id: params.orderId,
            },
            select: {
                status: true,
            }
        })

        if (!order) {
            throw new Error("Order does not exist");
        }

        const isUsersOrder = await this._dbService.order.findFirst({
            where: {
                id: params.orderId,
                userId: user.id
            }
        })

        if (!isUsersOrder) {
            throw new BadRequestException("Order does not belong to user");
        }

        if (order.status === 'CANCELLED') {
            throw new BadRequestException("Order already cancelled");
        }

        if (order.status !== 'PENDING') {
            throw new BadRequestException("Order cannot be cancelled");
        }

        const cancelledOrder = await this._dbService.order.update({
            where: {
                id: params.orderId,
            },
            data: {
                status: 'CANCELLED'
            },
        })

        if (!cancelledOrder) {
            throw new BadRequestException("Error cancelling the order");
        }

        const orderCancelled = await this._dbService.order.findUnique({
            where: {
                id: params.orderId,
            },
            select: {
                id: true,
                status: true,
                userId: true,
            }
        })

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
                    }
                },
            },
            orderBy: {
                createdAt: 'desc',
            }
        });

        if (!orders) {
            throw new BadRequestException("Error fetching orders");
        }

        const ordersWithTotalQuantity = orders.map(order => {
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
            laundryId
        } = data;

        const isOrderCompleted = await this._dbService.order.findFirst({
            where: {
                id: orderId,
                status: "COMPLETED",
            },
        });

        const createFeedback = async (
            rating: number | undefined,
            comments: string | undefined,
            type: FeedbackType,
        ) => {
            if (rating !== 0) {
                const res = await this._dbService.feedback.create({
                    data: {
                        userId: user.id,
                        rating,
                        comments: comments ?? "",
                        type,
                        orderId,
                        riderOrderId: type === "RIDER_PICKUP" ? pickupRiderOrderId : type === "RIDER_DELIVERY" ? deliveryRiderOrderId : null,
                        vendorOrderId: type === "VENDOR" ? vendorOrderId : null,
                        laundryId:type === "VENDOR" ? laundryId : null,
                    },
                });
                if (res) {
                    return true
                }
            }
        };

        if (isOrderCompleted) {
            const feedbacksCreated = await Promise.all([
                createFeedback(vendorRating, vendorFeedback, "VENDOR"),
                createFeedback(pickupRiderRating, pickupRiderFeedback, "RIDER_PICKUP"),
                createFeedback(deliveryRiderRating, deliveryRiderFeedback, "RIDER_DELIVERY"),
            ]);

            if (feedbacksCreated.some((feedback) => feedback === true)) {
                return { message: "Feedback added successfully" };
            }
            else {
                throw new BadRequestException("Error adding feedback");
            }
        }
        else {
            throw new BadRequestException("Order is not completed");
        }

    }

    async HasFeedback(params: HasFeedBackRequestDTO, user: User): Promise<HasFeedbackResponseDTO> {
        const feedback = await this._dbService.feedback.findFirst({
            where: {
                userId: user?.id,
                orderId: params.orderId,
            }
        });

        if (feedback) {
            return { hasFeedback: true }
        }
        else {
            return { hasFeedback: false }
        }
    }

    async validateCoupon(user: User, params: ValidateCouponRequestDTO, query: ValidateCouponQueryRequestDTO): Promise<ValidateCouponResponseDTO> {
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
                minOrderAmount:true,
                code: true,
                maxDiscount: true,
                usageLimit: true,
            }
        });

        if (!coupon) {
            throw new BadRequestException("Invalid coupon");
        }

        if (coupon.singleUse) {
            const couponUsed = await this._dbService.couponUsage.findFirst({
                where: {
                    userId: user.id,
                    couponId: coupon.id,
                }
            });

            if (couponUsed) {
                throw new BadRequestException("Coupon already used");
            }
        }

        if (coupon.usageLimit) {
            const couponUsage = await this._dbService.couponUsage.findMany({
                where: {
                    couponId: coupon.id,
                }
            });

            if (couponUsage.length >= coupon.usageLimit){
                throw new BadRequestException("Coupon limit reached");
            }
        }

        if (coupon.type === CouponType.FIXED && !query.cartAmount){
            throw new BadRequestException("Cart amount required for fixed coupon");
        }
       
        if (coupon.minOrderAmount && query.cartAmount < coupon.minOrderAmount) {
            throw new BadRequestException(`Minimum order amount should be ${coupon.minOrderAmount}SAR to use the ${coupon.code} coupon`);
        }
        if (coupon.type === CouponType.FIXED && query.cartAmount < coupon.discount){
            throw new BadRequestException(`Minimum cart amount should be ${coupon.discount}SAR to use the ${coupon.code} coupon`);
        }

        return coupon;
    }

    async getUserCoupons(user: User, query: getUserCouponsQueryDTO): Promise<GetUserCouponsResponseDTO> {
         switch(query.couponFilter){
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
                    }
                })
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
                    }
                })
                const data = {
                    totalCoupons: coupons.length,
                    vouchers:couponsPaginated
                }
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
                            }
                        }
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
                            }
                        }
                    },
                    distinct: ['couponId'],
                    orderBy: {
                        createdAt: 'desc',
                    },
                    ...pagination,
                    
                    })

                    const flattenCoupons = (coupons) => 
                        coupons.map((couponUsage) => ({
                            ...couponUsage.coupon, // Spread coupon properties
                        }));

                    const data=  {
                        totalCoupons: usedCoupons.length,
                        vouchers: flattenCoupons(usedCouponsPaginated)
                    }
                    return data;
                }


            case coupon.EXPIRED: {
                const pagination = GetPaginationOptions(query);
                const expiredCoupons = await this._dbService.couponUsage.findMany({
                    where: {
                        userId: user.id,
                        coupon: {
                           expiryDate : {
                                 lt: new Date(),
                           }
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
                            }
                        }
                    },
                    distinct: ['couponId'], 
                })
                const expiredCouponsPaginated = 
                await this._dbService.couponUsage.findMany({
                    where: {
                        userId: user.id,
                        coupon: {
                           expiryDate : {
                                 lt: new Date(),
                           }
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
                            }
                        }
                    },
                    distinct: ['couponId'], 
                    ...pagination,
                })
                const flattenCoupons = (coupons) => 
                    coupons.map((couponUsage) => ({
                        ...couponUsage.coupon, // Spread coupon properties
                    }));
            
                const data = {
                    totalCoupons: expiredCoupons.length,
                    vouchers: flattenCoupons(expiredCouponsPaginated)
                }
                return data;
            }
        }
        }

}
