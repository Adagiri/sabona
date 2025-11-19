import { Injectable } from '@nestjs/common';
import DatabaseService from '../../../database/database.service';
import { OrderStatus, OrderType, PickupStatus, User } from '@prisma/client';
import UpdateStatusRequestDTO from './dto/request/updateStatus.request';
import GetRideRequestsResponseDTO from './dto/response/getRideRequests.response';
import UpdateOrderStatusResponseDTO from './dto/response/updateOrderStatus.response';
import GetDeliveriesResponseDTO from './dto/response/getDeliveries.response';
import CancelOrderRequestDTO from './dto/request/src/modules/app/rider/dto/request/cancelOrderRequest';
import { BadRequestException } from 'src/core/exceptions/response.exception';
import { extractTokens } from 'src/helpers/util.helper';
import NotificationService from '../notification/notification.service';
import LocationService from '../location/location.service';
import { BooleanResponseDTO } from 'src/core/response/response.schema';
import { I18nContext, I18nService } from 'nestjs-i18n';
@Injectable()
export default class RiderService {
    private readonly locale: string;
    constructor(
        private _dbService: DatabaseService,
        private _notificationService: NotificationService,
        private _locationService: LocationService,
        private i18n: I18nService,
    ) {
        this.locale = I18nContext.current()?.lang || 'en';
    }

    /**
     * Get orders assigned to this specific rider
     * NO MORE general order list - only assigned orders
     */
    async getRides(user: User): Promise<GetRideRequestsResponseDTO> {
        // Get orders specifically assigned to this rider
        const assignedOrders = await this._dbService.riderOrder.findMany({
            where: {
                riderId: user.id,
                deletedAt: null, // Only active assignments
                order: {
                    status: {
                        in: ['ACCEPTED', 'READY_FOR_PICKUP'], // Orders needing rider action
                    },
                },
            },
            include: {
                order: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                                phone: true,
                            },
                        },
                        laundry: {
                            select: {
                                name: true,
                                address: true,
                                lat: true,
                                long: true,
                            },
                        },
                        services: {
                            select: {
                                items: {
                                    select: {
                                        quantity: true,
                                        laundryServiceItem: {
                                            select: {
                                                name: true,
                                                platformPrice: true,
                                                expressPlatformPrice: true
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        pickup: {
                            select: {
                                pickupAddress: true,
                                pickupLat: true,
                                pickupLong: true,
                                status: true,
                                pickupDate: true,
                                pickupTime: true,
                            },
                        },
                        delivery: {
                            select: {
                                deliveryAddress: true,
                                deliveryLat: true,
                                deliveryLong: true,
                                status: true,
                                deliveryDate: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                assignedAt: 'desc',
            },
        });

        // Transform data to include assignment context
        const transformedOrders = assignedOrders.map((riderOrder) => ({
            assignmentId: riderOrder.id,
            assignmentType: riderOrder.type, // RIDER_PICKUP or RIDER_DELIVERY
            assignedAt: riderOrder.assignedAt,
            order: riderOrder.order,
            // Add distance calculation for pickup location
            distanceToPickup: null, // We'll calculate this if driver location is available
        }));

        // Calculate distances if driver has location
        const driverLocation = await this._dbService.userLocation.findUnique({
            where: { userId: user.id },
        });

        if (driverLocation) {
            for (const assignedOrder of transformedOrders) {
                if (assignedOrder.order.pickup) {
                    const distance = this._locationService['calculateDistance'](
                        driverLocation.lat,
                        driverLocation.long,
                        assignedOrder.order.pickup.pickupLat,
                        assignedOrder.order.pickup.pickupLong,
                    );
                    assignedOrder.distanceToPickup = distance;
                }
            }
        }

        return { data: transformedOrders };
    }

    /**
     * Update order status - now includes validation that rider is assigned
     */
    async updateOrderStatus(params: UpdateStatusRequestDTO, user: User): Promise<UpdateOrderStatusResponseDTO> {
        // Verify rider is assigned to this order
        const latestRiderAssignment = await this._dbService.riderOrder.findFirst({
            where: {
                orderId: params.orderId,
                riderId: user.id,
                deletedAt: null,
            },
            orderBy: {
                assignedAt: 'desc',
            },
        });

        if (!latestRiderAssignment) {
            throw new BadRequestException('You are not assigned to this order');
        }

        const order = await this._dbService.order.findUnique({
            where: { id: params.orderId },
            select: { status: true, orderType: true },
        });

        if (!order) {
            throw new BadRequestException('Order does not exist');
        }

        // Get customer and vendor info for notifications
        const customerId = await this._dbService.order.findUnique({
            where: { id: params.orderId },
            select: { userId: true },
        });

        let vendorId: any[] = [];
        if (order.orderType === OrderType.REGISTERED_LAUNDRY) {
            const laundryId = await this._dbService.order.findUnique({
                where: { id: params.orderId },
                select: { laundryId: true },
            });

            vendorId = await this._dbService.laundry.findMany({
                where: { id: laundryId?.laundryId },
                select: { vendorId: true },
            });
        }

        // Get device tokens for notifications
        const customerDeviceTokens = await this._dbService.deviceToken.findMany({
            where: { userId: customerId?.userId, deletedAt: null },
            select: { token: true },
        });

        let vendorDeviceTokens: any[] = [];
        if (order.orderType === OrderType.REGISTERED_LAUNDRY && vendorId.length > 0) {
            vendorDeviceTokens = await this._dbService.deviceToken.findMany({
                where: { userId: vendorId[0]?.vendorId, deletedAt: null },
                select: { token: true },
            });
        }

        const customerTokens = extractTokens(customerDeviceTokens);
        const vendorTokens = extractTokens(vendorDeviceTokens);

        // Handle different status updates
        switch (params.status) {
            case 'ACCEPT':
                // For auto-assigned orders, this confirms the assignment
                if (order.status === 'ACCEPTED') {
                    // Update pickup status to accepted
                    await this._dbService.pickup.update({
                        where: { orderId: params.orderId },
                        data: {
                            riderId: user.id,
                            status: 'ACCEPTED',
                        },
                    });

                    // Send notifications
                    const customerNotificationData = {
                        tokens: customerTokens,
                        title: 'Driver Confirmed!',
                        body: 'Your assigned driver has confirmed and is on the way',
                        notificationData: {
                            orderId: params.orderId,
                            key: 'GET_ORDER_BY_ID',
                            route: 'TrackOrder',
                        },
                    };

                    if (customerTokens?.length) {
                        await this._notificationService.SendNotificationToMultipleTokens(customerNotificationData);

                        await this._dbService.notification.create({
                            data: {
                                userId: customerId.userId,
                                orderId: params.orderId,
                                message: 'Your assigned driver has confirmed and is on the way',
                                status: 'UNREAD',
                                data: {
                                    orderId: params.orderId,
                                    key: 'GET_ORDER_BY_ID',
                                    route: 'TrackOrder',
                                },
                                type: 'ORDER_ACCEPTED',
                            },
                        });
                    }

                    if (order.orderType === OrderType.REGISTERED_LAUNDRY && vendorTokens?.length) {
                        const vendorNotificationData = {
                            tokens: vendorTokens,
                            title: 'Driver Confirmed!',
                            // body: this.i18n.translate('order.driver_on_way_pickup', { lang: this.locale }),
                            body: 'Driver is on the way to pick up from customer',
                            notificationData: {
                                orderId: params.orderId,
                                key: 'GET_ORDER_BY_ID',
                                route: 'Track',
                            },
                        };

                        await this._notificationService.SendNotificationToMultipleTokens(vendorNotificationData);

                        await this._dbService.notification.create({
                            data: {
                                userId: vendorId[0].vendorId,
                                orderId: params.orderId,
                                message: 'Driver is on the way to pick up from customer',
                                status: 'UNREAD',
                                data: {
                                    orderId: params.orderId,
                                    key: 'GET_ORDER_BY_ID',
                                    route: 'Track',
                                },
                                type: 'ORDER_ACCEPTED',
                            },
                        });
                    }
                }
                break;

            case 'PICKED_UP':
                if (order.status === 'ACCEPTED') {
                    // Update pickup status
                    await this._dbService.pickup.update({
                        where: { orderId: params.orderId },
                        data: { status: 'PICKED_UP' },
                    });

                    // For custom orders, special handling
                    if (order.orderType === OrderType.CUSTOM_LAUNDRY) {
                        // Notify admin about pickup completion for custom orders
                        // Admin needs to track when driver reaches custom vendor
                        // This would be handled in admin notifications
                    }

                    // Send notifications about pickup
                    const customerNotificationData = {
                        tokens: customerTokens,
                        // title: this.i18n.translate('order.picked_up_title', { lang: this.locale }),
                        title: 'Order Picked Up!',
                        body: 'Your order has been picked up by the driver',
                        notificationData: {
                            orderId: params.orderId,
                            key: 'GET_ORDER_BY_ID',
                            route: 'TrackOrder',
                        },
                    };

                    if (customerTokens?.length) {
                        await this._notificationService.SendNotificationToMultipleTokens(customerNotificationData);

                        await this._dbService.notification.create({
                            data: {
                                userId: customerId.userId,
                                orderId: params.orderId,
                                message: 'Your order has been picked up by the driver',
                                status: 'UNREAD',
                                data: {
                                    orderId: params.orderId,
                                    key: 'GET_ORDER_BY_ID',
                                    route: 'TrackOrder',
                                },
                                type: 'ORDER_PICKED_UP',
                            },
                        });
                    }
                }
                break;

            case 'DROPPED_OFF':
                // Handle drop-off at vendor or customer
                if (latestRiderAssignment.type === 'RIDER_PICKUP') {
                    // Dropping off at vendor
                    await this._dbService.pickup.update({
                        where: { orderId: params.orderId },
                        data: { status: 'DELIVERED_TO_VENDOR' },
                    });

                    if (order.orderType === OrderType.REGISTERED_LAUNDRY) {
                        // Update order status to IN_PROGRESS
                        await this._dbService.order.update({
                            where: { id: params.orderId },
                            data: { status: OrderStatus.IN_PROGRESS },
                        });
                    }
                } else if (latestRiderAssignment.type === 'RIDER_DELIVERY') {
                    // Final delivery to customer
                    await this._dbService.delivery.update({
                        where: { orderId: params.orderId },
                        data: { status: 'DELIVERED_TO_USER' },
                    });

                    await this._dbService.order.update({
                        where: { id: params.orderId },
                        data: { status: OrderStatus.COMPLETED },
                    });
                }
                break;

            default:
                throw new BadRequestException('Invalid status update');
        }

        return { message: 'SUCCESS' };
    }

    /**
     * Update driver's current location
     */
    async updateLocation(user: User, lat: number, long: number): Promise<{ message: string }> {
        await this._locationService.updateDriverLocation(user.id, lat, long);
        return { message: 'Location updated successfully' };
    }

    async getDeliveries(user: User): Promise<GetDeliveriesResponseDTO> {
        const deliveries = await this._dbService.riderOrder.findMany({
            where: {
                riderId: user.id,
                order: {
                    status: {
                        not: OrderStatus.CANCELLED,
                    },
                },
            },
            select: {
                orderId: true,
                feedbacks: {
                    select: {
                        rating: true,
                        comments: true,
                    },
                },
                order: {
                    select: {
                        totalAmount: true,
                        status: true,
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                            },
                        },
                        services: {
                            select: {
                                items: {
                                    select: {
                                        quantity: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: {
                order: {
                    createdAt: 'desc',
                },
            },
        });

        return { data: deliveries };
    }

    async cancelOrder(params: CancelOrderRequestDTO, user: User): Promise<UpdateOrderStatusResponseDTO> {
        const pickupOrder = await this._dbService.pickup.findFirst({
            where: {
                riderId: user.id,
                orderId: params.orderId,
                status: OrderStatus.ACCEPTED,
            },
        });

        const deliveryOrder = await this._dbService.delivery.findFirst({
            where: {
                riderId: user.id,
                orderId: params.orderId,
                status: OrderStatus.ACCEPTED,
            },
        });

        if (!pickupOrder && !deliveryOrder) {
            throw new BadRequestException('You can not cancel this order');
        }

        if (pickupOrder) {
            console.log('pickupOrder');
            const updateStatus = await this._dbService.pickup.update({
                where: {
                    orderId: params.orderId,
                },
                data: {
                    status: PickupStatus.PENDING,
                    riderId: null,
                },
            });

            if (!updateStatus) {
                throw new BadRequestException('Error updating status');
            }
        }

        if (deliveryOrder) {
            console.log('deliveryOrder');
            const updateStatus = await this._dbService.delivery.update({
                where: {
                    orderId: params.orderId,
                },
                data: {
                    status: PickupStatus.PENDING,
                    riderId: null,
                },
            });

            if (!updateStatus) {
                throw new BadRequestException('Error updating status');
            }
        }

        return { message: 'SUCCESS' };
    }

    async getCurrentOrders(user: User): Promise<GetDeliveriesResponseDTO> {
        const orders = await this._dbService.riderOrder.findMany({
            where: {
                riderId: user.id,
                order: {
                    status: {
                        in: [OrderStatus.ACCEPTED, OrderStatus.READY_FOR_PICKUP],
                    },
                },
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
                            },
                        },
                        services: {
                            select: {
                                items: {
                                    select: {
                                        quantity: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: {
                order: {
                    createdAt: 'desc',
                },
            },
        });
        return { data: orders };
    }

    async getLastOrder(user: User): Promise<{ data: any }> {
        const order = await this._dbService.riderOrder.findFirst({
            where: {
                riderId: user.id,
            },
            orderBy: {
                assignedAt: 'desc',
            },
        });

        if (!order) {
            throw new BadRequestException('No orders found');
        }

        return { data: order };
    }

    async deleteMyAccount(user: User): Promise<BooleanResponseDTO> {
        const activeAssignments = await this._dbService.riderOrder.count({
            where: {
                riderId: user.id,
                deletedAt: null,
                order: {
                    status: {
                        in: ['ACCEPTED', 'IN_PROGRESS', 'READY_FOR_PICKUP'],
                    },
                },
            },
        });

        if (activeAssignments > 0) {
            throw new BadRequestException('Cannot delete account with active delivery assignments');
        }

        // Soft delete using existing middleware
        await this._dbService.user.delete({
            where: { id: user.id },
        });

        return { data: true };
    }
}
