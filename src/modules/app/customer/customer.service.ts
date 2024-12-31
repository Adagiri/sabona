import { BadRequestException, Injectable } from '@nestjs/common';
import DatabaseService from '../../../database/database.service';
import { User } from '@prisma/client';
import CreateOrderRequestDTO from './dto/request/createOrder.request';
import AcceptOrderRequestDTO from '../vendor/dto/request/acceptOrder.request';
import CancelOrderResponseDTO from './dto/response/cancelOrder.response';
import { OrderListDto } from './dto/response/orderlist.response.dto';
import { extractTokens } from 'src/helpers/util.helper';
import NotificationService from '../notification/notification.service';
import { MultipleDeviceNotificationDto } from '../notification/dto/request/notification.request';

@Injectable()
export default class CustomerService {
    constructor(
        private _dbService: DatabaseService,
        private _notificationService: NotificationService,
    ) { }

    async CreateOrder(data: CreateOrderRequestDTO, user: User): Promise<any> {
        // Fetch customer device tokens
        const customerDeviceTokensPromise = this._dbService.user.findMany({
            where: {
                DeviceToken: { some: { token: { not: "" } } },
                id: user.id,
            },
            select: {
                DeviceToken: {
                    select: {
                        token: true,
                    },
                },
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

        const vendorsDeviceTokensPromise = await this._dbService.user.findMany({
            where: {
                DeviceToken: { some: { token: { not: "" } } },
                id: vendorId[0].vendorId,
            },
            select: {
                DeviceToken: {
                    select: {
                        token: true,
                    },
                },
            },
        });

        // Create the order
        const orderPromise = this._dbService.order.create({
            data: {
                userId: user.id,
                laundryId: data.laundryId,
                totalAmount: data.totalAmount,
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
        const customerNotificationData = {
            tokens: customserTokens,
            title: "Order Placed!!",
            body: "Your order has been placed successfully.",
            data:{
                orderId: order.id,
                route: "APP_ROUTES.USER.TRACK_ORDER",
                key: "FETCH_ORDER_DETAILS"
            }
        };

        // Send Vendor notification Data
        const vendorNotificationData = {
            tokens: vendorTokens,
            title: "New Order!!",
            body: "You have recieved a new order.",
            data:{
                orderId: order.id,
                route: "APP_ROUTES.USER.HOME_TABS",
                key: "FETCH_ORDER_REQUESTS"
            }
        };


        await this._notificationService.SendNotificationToMultipleTokens(customerNotificationData);
        await this._notificationService.SendNotificationToMultipleTokens(vendorNotificationData);


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
}
