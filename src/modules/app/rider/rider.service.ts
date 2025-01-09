import { Injectable } from '@nestjs/common';
import DatabaseService from '../../../database/database.service';
import { OrderStatus, PickupStatus, User } from '@prisma/client';
import UpdateStatusRequestDTO from './dto/request/updateStatus.request';
import GetRideRequestsResponseDTO from './dto/response/getRideRequests.response';
import UpdateOrderStatusResponseDTO from './dto/response/updateOrderStatus.response';
import GetDeliveriesResponseDTO from './dto/response/getDeliveries.response';
import CancelOrderRequestDTO from './dto/request/src/modules/app/rider/dto/request/cancelOrderRequest';
import { BadRequestException } from 'src/core/exceptions/response.exception';
import { extractTokens } from 'src/helpers/util.helper';
import NotificationService from '../notification/notification.service';

@Injectable()
export default class RiderService {
    constructor(
        private _dbService: DatabaseService,
        private _notificationService: NotificationService,
    ) { }

    async getRides(user: User): Promise<GetRideRequestsResponseDTO> {

        const rideRequests = await this._dbService.order.findMany({
            where: {
                OR: [
                    {
                        AND: [
                            {
                                OR: [
                                    { status: 'ACCEPTED' },
                                    { status: 'READY_FOR_PICKUP' }
                                ]
                            },
                            {
                                OR: [
                                    {
                                        riderOrders: { none: { deletedAt: null } } // no rider assigned, and not deleted 
                                    },
                                    {
                                        riderOrders: {
                                            every: {
                                                riderId: user.id,
                                                deletedAt: null // current rider assigned, and not deleted 
                                            }
                                        }
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        riderOrders: {
                            some: {
                                riderId: user.id,
                                deletedAt: null
                            },
                        },
                        NOT: {
                            status: {
                                in: [OrderStatus.IN_PROGRESS, OrderStatus.COMPLETED]
                            }
                        }
                    }
                ],
                NOT: {
                    status: 'CANCELLED'
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            select: {
                id: true,
                userId: true,
                laundry: {
                    select: {
                        name: true,
                        address: true,
                    }
                },
                riderOrders: {
                    select: {
                        riderId: true,
                    },
                },
                pickup: {
                    select: {
                        pickupAddress: true,
                        pickupLat: true,
                        pickupLong: true,
                        status: true,
                    }
                },
                delivery: {
                    select: {
                        deliveryAddress: true,
                        deliveryLat: true,
                        deliveryLong: true,
                        status: true,
                    }
                },
                status: true,
                deliveryType: true,
            }
        });

        return { data: rideRequests };
    }


    async updateOrderStatus(params: UpdateStatusRequestDTO, user: User): Promise<UpdateOrderStatusResponseDTO> {
        const order = await this._dbService.order.findUnique({
            where: {
                id: params.orderId
            },
            select: {
                status: true,
            }
        });

        if (!order) {
            throw new BadRequestException("Order does not exist");
        }

        const customerId = await this._dbService.order.findUnique({
            where: {
                id: params.orderId
            },
            select: {
                userId: true,
            }
        });

        const laundryId = await this._dbService.order.findUnique({
            where: {
                id: params.orderId
            },
            select: {
                laundryId: true,
            }
        });

        const vendorId = await this._dbService.laundry.findMany({
            where: {
                id: laundryId?.laundryId,
            },
            select: {
                vendorId: true,
            }

        });

        const vendorDeviceTokens = await this._dbService.deviceToken.findMany({
            where: {
                userId: vendorId[0]?.vendorId,
                deletedAt: null
            },
            select: {
                token: true,
            },
        });

        const customerDeviceTokens = await this._dbService.deviceToken.findMany({
            where: {
                userId: customerId?.userId,
                deletedAt: null,
            },
            select: {
                token: true,
            },
        });

        // Extract Customer tokens
        const customserTokens = extractTokens(customerDeviceTokens);

        // Extract Vendor tokens
        const vendorTokens = extractTokens(vendorDeviceTokens);

        switch (params.status) {
            case 'ACCEPT':

                const haveOrder = await this._dbService.riderOrder.findFirst({
                    where: {
                        orderId: params.orderId,
                    }
                });

                const riderOrder = await this._dbService.riderOrder.create({
                    data: {
                        orderId: params.orderId,
                        riderId: user.id,
                        type: haveOrder ? 'RIDER_DELIVERY' : 'RIDER_PICKUP',
                    }
                });

                if (!riderOrder) {
                    throw new BadRequestException("Failed to accept order");
                }


                if (order.status === 'ACCEPTED') {

                    const customerNotificationData = {
                        tokens: customserTokens,
                        title: "Rider on the way!!",
                        body: "Your order has been accepted by rider.",
                        notificationData: {
                            orderId: params.orderId,
                            key: 'GET_ORDER_BY_ID',
                            route: 'TrackOrder',
                        }
                    };

                    // Send Vendor notification Data
                    const vendorNotificationData = {
                        tokens: vendorTokens,
                        title: "Order Accepted by rider!!",
                        body: "Rider is on the way to pick from customer.",
                        notificationData: {
                            orderId: params.orderId,
                            key: 'GET_ORDER_BY_ID',
                            route: 'Track',
                        }
                    };


                    const updatedPickup = await this._dbService.pickup.update({
                        where: {
                            orderId: params.orderId
                        },
                        data: {
                            riderId: user.id,
                            status: 'ACCEPTED'
                        }
                    });
                    if (!updatedPickup) {
                        throw new BadRequestException("Error updating pickup status")
                    }

                    if (customserTokens?.length) {
                        const res = await this._notificationService.SendNotificationToMultipleTokens(customerNotificationData);
                        if (res) {
                            const createNotification = await this._dbService.notification.create({
                                data: {
                                    userId: customerId.userId,
                                    orderId: params.orderId,
                                    message: "Your order has been accepted by rider.",
                                    status: "UNREAD",
                                    data: {
                                        orderId: params.orderId,
                                        key: 'GET_ORDER_BY_ID',
                                        route: 'TrackOrder',
                                    },
                                    type: "ORDER_ACCEPTED",
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
                    if (vendorTokens?.length) {
                        const res = await this._notificationService.SendNotificationToMultipleTokens(vendorNotificationData);
                        if (res) {
                            const createNotification = await this._dbService.notification.create({
                                data: {
                                    userId: vendorId[0].vendorId,
                                    orderId: params.orderId,
                                    message: "Rider is on the way to pick from customer.",
                                    status: "UNREAD",
                                    data: {
                                        orderId: params.orderId,
                                        key: 'GET_ORDER_BY_ID',
                                        route: 'Track',
                                    },
                                    type: "ORDER_ACCEPTED",
                                }
                            });
                            if (createNotification) {
                                console.log("Vendor Notification created successfully");
                            }
                            else {
                                console.log("Error creating notification");
                            }
                        }
                    }

                } else if (order.status === 'READY_FOR_PICKUP') {

                    const customerNotificationData = {
                        tokens: customserTokens,
                        title: "Out for delivery!!",
                        body: "Rider is on the way to laundry to pick your processed order.",
                        notificationData: {
                            orderId: params.orderId,
                            key: 'GET_ORDER_BY_ID',
                            route: 'TrackOrder',
                        }
                    };

                    const vendorNotificationData = {
                        tokens: vendorTokens,
                        title: "Rider on the way!!",
                        body: "Rider is on the way to pick up the order from your laundry.",
                        notificationData: {
                            orderId: params.orderId,
                            key: 'GET_USER_ORDERS',
                            route: 'Orders',
                        }
                    };

                    const updatedDelivery = await this._dbService.delivery.update({
                        where: {
                            orderId: params.orderId
                        },
                        data: {
                            riderId: user.id,
                            status: 'ACCEPTED'
                        }
                    });

                    if (!updatedDelivery) {
                        throw new BadRequestException("Error updating delivery status")
                    }

                    if (customserTokens?.length) {
                        const res = await this._notificationService.SendNotificationToMultipleTokens(customerNotificationData);
                        if (res) {
                            const createNotification = await this._dbService.notification.create({
                                data: {
                                    userId: customerId.userId,
                                    orderId: params.orderId,
                                    message: "Rider is on the way to laundry to pick your processed order.",
                                    status: "UNREAD",
                                    data: {
                                        orderId: params.orderId,
                                        key: 'GET_ORDER_BY_ID',
                                        route: 'TrackOrder',
                                    },
                                    type: "ORDER_PROCESSING",
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

                    if (vendorTokens?.length) {
                        const res = await this._notificationService.SendNotificationToMultipleTokens(vendorNotificationData);
                        if (res) {
                            const createNotification = await this._dbService.notification.create({
                                data: {
                                    userId: vendorId[0].vendorId,
                                    orderId: params.orderId,
                                    message: "Rider is on the way to pick up the order from your laundry.",
                                    status: "UNREAD",
                                    data: {
                                        orderId: params.orderId,
                                        key: 'GET_USER_ORDERS',
                                        route: 'Orders',
                                    },
                                    type: "ORDER_PROCESSING",
                                }
                            });
                            if (createNotification) {
                                console.log("Vendor Notification created successfully");
                            }
                            else {
                                console.log("Error creating notification");
                            }
                        }
                    }
                }

                return { message: 'SUCCESS' }

            case 'PICKED_UP':
                if (order.status === 'ACCEPTED') {

                    const customerNotificationData = {
                        tokens: customserTokens,
                        title: "Order Picked up!!",
                        body: "Your order has been picked up by the rider.",
                        notificationData: {
                            orderId: params.orderId,
                            key: 'GET_ORDER_BY_ID',
                            route: 'TrackOrder',
                        }
                    };

                    // Send Vendor notification Data
                    const vendorNotificationData = {
                        tokens: vendorTokens,
                        title: "Order picked up!!",
                        body: "Rider has picked up the order and is on the way to vendor.",
                        notificationData: {
                            orderId: params.orderId,
                            key: 'GET_ORDER_BY_ID',
                            route: 'Track',
                        }
                    };

                    const updateStatusPickedUp = await this._dbService.pickup.update({
                        where: {
                            orderId: params.orderId
                        },
                        data: {
                            status: 'PICKED_UP'
                        }
                    });

                    if (!updateStatusPickedUp) {
                        throw new BadRequestException("Could not update status");
                    }

                    if (customserTokens?.length) {
                        const res = await this._notificationService.SendNotificationToMultipleTokens(customerNotificationData);
                        if (res) {
                            const createNotification = await this._dbService.notification.create({
                                data: {
                                    userId: customerId.userId,
                                    orderId: params.orderId,
                                    message: "Your order has been picked up by the rider.",
                                    status: "UNREAD",
                                    data: {
                                        orderId: params.orderId,
                                        key: 'GET_ORDER_BY_ID',
                                        route: 'TrackOrder',
                                    },
                                    type: "ORDER_PICKED_UP",
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

                    if (vendorTokens?.length) {
                        const res = await this._notificationService.SendNotificationToMultipleTokens(vendorNotificationData);
                        if (res) {
                            const createNotification = await this._dbService.notification.create({
                                data: {
                                    userId: vendorId[0].vendorId,
                                    orderId: params.orderId,
                                    message: "Rider has picked up the order and is on the way to vendor.",
                                    status: "UNREAD",
                                    data: {
                                        orderId: params.orderId,
                                        key: 'GET_ORDER_BY_ID',
                                        route: 'Track',
                                    },
                                    type: "ORDER_PICKED_UP",
                                }
                            });
                            if (createNotification) {
                                console.log("Vendor Notification created successfully");
                            }
                            else {
                                console.log("Error creating notification");
                            }
                        }
                    }


                    return { message: 'SUCCESS' }
                }
                else if (order.status === 'READY_FOR_PICKUP') {

                    const customerNotificationData = {
                        tokens: customserTokens,
                        title: "Out for delivery!!",
                        body: "Rider has picked up your order and can reach any time soon.",
                        notificationData: {
                            orderId: params.orderId,
                            key: 'GET_ORDER_BY_ID',
                            route: 'TrackOrder',
                        }
                    };

                    // Send Vendor notification Data
                    const vendorNotificationData = {
                        tokens: vendorTokens,
                        title: "Order picked up!!",
                        body: "Rider has picked up the order from your laundry.",
                        notificationData: {
                            orderId: params.orderId,
                            key: 'GET_USER_ORDERS',
                            route: 'Orders',
                        }
                    };

                    const updateStatusPickedUpFromVendor = await this._dbService.delivery.update({
                        where: {
                            orderId: params.orderId
                        },
                        data: {
                            status: 'PICKED_UP_FROM_VENDOR'
                        }
                    });

                    if (!updateStatusPickedUpFromVendor) {
                        throw new BadRequestException("Could not update status");
                    }

                    if (customserTokens?.length) {
                        const res = await this._notificationService.SendNotificationToMultipleTokens(customerNotificationData);
                        if (res) {
                            const createNotification = await this._dbService.notification.create({
                                data: {
                                    userId: customerId.userId,
                                    orderId: params.orderId,
                                    message: "Rider has picked up your order and can reach any time soon.",
                                    status: "UNREAD",
                                    data: {
                                        orderId: params.orderId,
                                        key: 'GET_ORDER_BY_ID',
                                        route: 'TrackOrder',
                                    },
                                    type: "ORDER_PROCESSING",
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
                    if (vendorTokens?.length) {
                        const res = await this._notificationService.SendNotificationToMultipleTokens(vendorNotificationData);
                        if (res) {
                            const createNotification = await this._dbService.notification.create({
                                data: {
                                    userId: vendorId[0].vendorId,
                                    orderId: params.orderId,
                                    message: "Rider has picked up the order from your laundry.",
                                    status: "UNREAD",
                                    data: {
                                        orderId: params.orderId,
                                        key: 'GET_USER_ORDERS',
                                        route: 'Orders',
                                    },
                                    type: "ORDER_PICKED_UP",
                                }
                            });
                            if (createNotification) {
                                console.log("Vendor Notification created successfully");
                            }
                            else {
                                console.log("Error creating notification");
                            }
                        }
                    }

                    return { message: 'SUCCESS' }
                }


            case 'DROPPED_OFF':
                if (order.status === 'ACCEPTED') {

                    const customerNotificationData = {
                        tokens: customserTokens,
                        title: "In Progress!!",
                        body: "Rider has delivered the order to vendor and is now processing.",
                        notificationData: {
                            orderId: params.orderId,
                            key: 'GET_ORDER_BY_ID',
                            route: 'TrackOrder',
                        }
                    };

                    const vendorNotificationData = {
                        tokens: vendorTokens,
                        title: "Order Delievered!!",
                        body: "The rider has delivered the order at your laundry.",
                        notificationData: {
                            orderId: params.orderId,
                            key: 'GET_ORDER_BY_ID',
                            route: 'Track',
                        }
                    };

                    const updateStatusDeliveredtoVendor = await this._dbService.pickup.update({
                        where: {
                            orderId: params.orderId
                        },
                        data: {
                            status: 'DELIVERED_TO_VENDOR'
                        }
                    });

                    if (!updateStatusDeliveredtoVendor) {
                        throw new BadRequestException("Could not update status");
                    }

                    await this._dbService.order.update({
                        where: {
                            id: params.orderId
                        },
                        data: {
                            status: 'IN_PROGRESS'
                        }
                    });

                    if (customserTokens?.length) {
                        const res = await this._notificationService.SendNotificationToMultipleTokens(customerNotificationData);
                        if (res) {
                            const createNotification = await this._dbService.notification.create({
                                data: {
                                    userId: customerId.userId,
                                    orderId: params.orderId,
                                    message: "Rider has delivered the order to vendor and is now processing.",
                                    status: "UNREAD",
                                    data: {
                                        orderId: params.orderId,
                                        key: 'GET_ORDER_BY_ID',
                                        route: 'TrackOrder',
                                    },
                                    type: "ORDER_PROCESSING",
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
                    if (vendorTokens?.length) {
                        const res = await this._notificationService.SendNotificationToMultipleTokens(vendorNotificationData);
                        if (res) {
                            const createNotification = await this._dbService.notification.create({
                                data: {
                                    userId: vendorId[0].vendorId,
                                    orderId: params.orderId,
                                    message: "The rider has delivered the order at your laundry.",
                                    status: "UNREAD",
                                    data: {
                                        orderId: params.orderId,
                                        key: 'GET_ORDER_BY_ID',
                                        route: 'Track',
                                    },
                                    type: "ORDER_DELIVERED",
                                }
                            });
                            if (createNotification) {
                                console.log("Vendor Notification created successfully");
                            }
                            else {
                                console.log("Error creating notification");
                            }
                        }
                    }

                    return { message: 'SUCCESS' }

                }
                else if (order.status === 'READY_FOR_PICKUP') {

                    const customerNotificationData = {
                        tokens: customserTokens,
                        title: "Order Completed!!",
                        body: "Rider has delivered the order to you.",
                        notificationData: {
                            orderId: params.orderId,
                            key: 'GET_ORDER_BY_ID',
                            route: 'TrackOrder',
                        }
                    };

                    const vendorNotificationData = {
                        tokens: vendorTokens,
                        title: "Order Delivered!!",
                        body: "Rider has delivered the order to the customer.",
                        notificationData: {
                            orderId: params.orderId,
                            key: 'GET_USER_ORDERS',
                            route: 'Orders',
                        }
                    };

                    const updateStatusDeliveredToUser = await this._dbService.delivery.update({
                        where: {
                            orderId: params.orderId
                        },
                        data: {
                            status: 'DELIVERED_TO_USER'
                        }
                    });

                    if (!updateStatusDeliveredToUser) {
                        throw new BadRequestException("Could not update status");
                    }

                    await this._dbService.order.update({
                        where: {
                            id: params.orderId
                        },
                        data: {
                            status: 'COMPLETED'
                        }
                    });

                    if (customserTokens?.length) {
                        const res = await this._notificationService.SendNotificationToMultipleTokens(customerNotificationData);
                        if (res) {
                            const createNotification = await this._dbService.notification.create({
                                data: {
                                    userId: customerId.userId,
                                    orderId: params.orderId,
                                    message: "Rider has delivered the order to you.",
                                    status: "UNREAD",
                                    data: {
                                        orderId: params.orderId,
                                        key: 'GET_ORDER_BY_ID',
                                        route: 'TrackOrder',
                                    },
                                    type: "ORDER_DELIVERED",
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
                    if (vendorTokens?.length) {
                        const res = await this._notificationService.SendNotificationToMultipleTokens(vendorNotificationData);
                        if (res) {
                            const createNotification = await this._dbService.notification.create({
                                data: {
                                    userId: vendorId[0].vendorId,
                                    orderId: params.orderId,
                                    message: "Rider has delivered the order to the customer.",
                                    status: "UNREAD",
                                    data: {
                                        orderId: params.orderId,
                                        key: 'GET_USER_ORDERS',
                                        route: 'Orders',
                                    },
                                    type: "ORDER_DELIVERED",
                                }
                            });
                            if (createNotification) {
                                console.log("Vendor Notification created successfully");
                            }
                            else {
                                console.log("Error creating notification");
                            }
                        }
                    }
                    return { message: 'SUCCESS' }
                }
        }
    }

    async getDeliveries(user: User): Promise<GetDeliveriesResponseDTO> {
        const deliveries = await this._dbService.riderOrder.findMany({
            where: {
                riderId: user.id,
                order: {
                    status: {
                        not: OrderStatus.CANCELLED
                    }
                }
            },
            select: {
                orderId: true,
                feedbacks:{
                    select:{
                        rating: true,
                        comments: true,
                    }
                },
                order: {
                    select: {
                        totalAmount: true,
                        status: true,
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                            }
                        },
                        services: {
                            select: {
                                items: {
                                    select: {
                                        quantity: true,
                                    }
                                }
                            }
                        }

                    }
                }
            },
            orderBy: {
                order: {
                    createdAt: 'desc'
                }
            }
        })



        return { data: deliveries };
    }

    async cancelOrder(params: CancelOrderRequestDTO, user: User): Promise<UpdateOrderStatusResponseDTO> {
        const pickupOrder = await this._dbService.pickup.findFirst({
            where: {
                riderId: user.id,
                orderId: params.orderId,
                status: OrderStatus.ACCEPTED
            },
        });

        const deliveryOrder = await this._dbService.delivery.findFirst({
            where: {
                riderId: user.id,
                orderId: params.orderId,
                status: OrderStatus.ACCEPTED
            },
        });

        if (!pickupOrder && !deliveryOrder) {
            throw new BadRequestException("You can not cancel this order");
        }

        if (pickupOrder) {
            console.log('pickupOrder');
            const updateStatus = await this._dbService.pickup.update({
                where: {
                    orderId: params.orderId
                },
                data: {
                    status: PickupStatus.PENDING,
                    riderId: null
                }
            });

            if (!updateStatus) {
                throw new BadRequestException("Error updating status");
            }
        }

        if (deliveryOrder) {
            console.log('deliveryOrder');
            const updateStatus = await this._dbService.delivery.update({
                where: {
                    orderId: params.orderId
                },
                data: {
                    status: PickupStatus.PENDING,
                    riderId: null
                }
            });

            if (!updateStatus) {
                throw new BadRequestException("Error updating status");
            }
        }

        return { message: 'SUCCESS' }
    }

    async getCurrentOrders(user: User): Promise<GetDeliveriesResponseDTO> {
        const orders = await this._dbService.riderOrder.findMany({
            where: {
                riderId: user.id,
                order: {
                    status: {
                        in: [OrderStatus.ACCEPTED, OrderStatus.READY_FOR_PICKUP]
                    }
                }
            },
            select: {
                orderId: true,
                order: {
                    select: {
                        totalAmount: true,
                        status: true,
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                            }
                        },
                        services: {
                            select: {
                                items: {
                                    select: {
                                        quantity: true,
                                    }
                                }
                            }
                        }

                    }
                }
            },
            orderBy: {
                order: {
                    createdAt: 'desc'
                }
            }
        })
        return { data: orders };
    }

    async getLastOrder(user: User): Promise<{}> {
        const order = await this._dbService.riderOrder.findFirst({
            where: {
                riderId: user.id,
            },
            orderBy: {
                assignedAt: 'desc'
            }
        });

        if (!order) {
            throw new BadRequestException("No orders found");
        }

        return { data: order };
    }
}