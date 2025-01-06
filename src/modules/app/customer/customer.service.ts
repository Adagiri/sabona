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
}
