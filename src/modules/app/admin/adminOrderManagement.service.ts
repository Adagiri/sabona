import { Injectable } from '@nestjs/common';
import { BadRequestException } from 'src/core/exceptions/response.exception';
import DatabaseService from '../../../database/database.service';
import NotificationService from '../notification/notification.service';
import { OrderStatus, OrderType, RiderOrderType, User } from '@prisma/client';
import { UpdateOrderStatusResponseDTO, AddOrderNotesResponseDTO } from './dto/response/updateOrderStatus.response';

/**
 * Admin Service - Order Management Methods
 *
 * These methods allow admin to perform actions on behalf of vendors and drivers
 * to manage the complete order flow.
 */

@Injectable()
export default class AdminOrderManagementService {
    constructor(
        private _dbService: DatabaseService,
        private _notificationService: NotificationService,
    ) {}

    /**
     * Accept pickup ride on behalf of driver
     * Equivalent to: PATCH /rider/:orderId/ACCEPT
     */
    async acceptPickupRide(orderId: string, adminUser: User): Promise<UpdateOrderStatusResponseDTO> {
        console.log(typeof adminUser);
        const order = await this._dbService.order.findUnique({
            where: { id: orderId },
            include: {
                user: { select: { id: true, firstName: true, lastName: true } },
                laundry: { select: { vendorId: true, name: true } },
                pickup: { select: { riderId: true, status: true } },
            },
        });

        if (!order) {
            throw new BadRequestException('Order not found');
        }

        if (order.status !== OrderStatus.ACCEPTED) {
            throw new BadRequestException('Order must be in ACCEPTED status');
        }

        if (!order.pickup?.riderId) {
            throw new BadRequestException('No driver assigned to this order');
        }

        // Update pickup status to accepted
        await this._dbService.pickup.update({
            where: { orderId: orderId },
            data: { status: 'ACCEPTED' },
        });

        // Notify customer
        if (order.user.id) {
            await this._notificationService.SendMultilingualNotificationToUser(order.user.id, 'ORDER_ACCEPTED', {
                orderId: order.id,
                key: 'GET_ORDER_BY_ID',
                route: 'TrackOrder',
            });
        }

        // Notify vendor
        if (order.laundry?.vendorId && order.orderType === OrderType.REGISTERED_LAUNDRY) {
            await this._notificationService.SendMultilingualNotificationToUser(
                order.laundry.vendorId,
                'ORDER_ACCEPTED',
                {
                    orderId: order.id,
                    key: 'GET_ORDER_BY_ID',
                    route: 'Track',
                },
            );
        }

        return {
            message: 'Pickup ride accepted successfully on behalf of driver',
            data: {
                orderId: order.id,
                status: order.status,
                updatedAt: new Date(),
            },
        };
    }

    /**
     * Mark order as picked up from customer on behalf of driver
     * Equivalent to: PATCH /rider/:orderId/PICKED_UP
     */
    async markPickedUp(orderId: string, adminUser: User): Promise<UpdateOrderStatusResponseDTO> {
        console.log(typeof adminUser);

        const order = await this._dbService.order.findUnique({
            where: { id: orderId },
            include: {
                user: { select: { id: true } },
                pickup: { select: { status: true } },
            },
        });

        if (!order) {
            throw new BadRequestException('Order not found');
        }

        if (order.status !== OrderStatus.ACCEPTED) {
            throw new BadRequestException('Order must be in ACCEPTED status');
        }

        // Update pickup status
        await this._dbService.pickup.update({
            where: { orderId: orderId },
            data: { status: 'PICKED_UP' },
        });

        // Notify customer
        if (order.user.id) {
            await this._notificationService.SendMultilingualNotificationToUser(order.user.id, 'ORDER_PICKED_UP', {
                orderId: order.id,
                key: 'GET_ORDER_BY_ID',
                route: 'TrackOrder',
            });
        }

        return {
            message: 'Order marked as picked up successfully',
            data: {
                orderId: order.id,
                status: order.status,
                updatedAt: new Date(),
            },
        };
    }

    /**
     * Mark items dropped off at vendor (triggers IN_PROGRESS) on behalf of driver
     * Equivalent to: PATCH /rider/:orderId/DROPPED_OFF (for pickup)
     */
    async markDroppedAtVendor(orderId: string, adminUser: User): Promise<UpdateOrderStatusResponseDTO> {
        console.log(typeof adminUser);

        const order = await this._dbService.order.findUnique({
            where: { id: orderId },
            include: {
                user: { select: { id: true } },
                laundry: { select: { vendorId: true, name: true } },
                pickup: { select: { status: true } },
            },
        });

        if (!order) {
            throw new BadRequestException('Order not found');
        }

        if (order.status !== OrderStatus.ACCEPTED) {
            throw new BadRequestException('Order must be in ACCEPTED status');
        }

        // Update pickup status to delivered to vendor
        await this._dbService.pickup.update({
            where: { orderId: orderId },
            data: { status: 'DELIVERED_TO_VENDOR' },
        });

        // Update order status to IN_PROGRESS
        if (order.orderType === OrderType.REGISTERED_LAUNDRY) {
            await this._dbService.order.update({
                where: { id: orderId },
                data: { status: OrderStatus.IN_PROGRESS },
            });

            // Add status history
            await this._dbService.orderStatusHistory.create({
                data: {
                    orderId: orderId,
                    status: OrderStatus.IN_PROGRESS,
                    timestamp: new Date(),
                },
            });
        }

        // Notify vendor
        if (order.laundry?.vendorId) {
            await this._notificationService.SendMultilingualNotificationToUser(
                order.laundry.vendorId,
                'ORDER_IN_PROGRESS',
                {
                    orderId: order.id,
                    key: 'GET_ORDER_BY_ID',
                    route: 'Track',
                },
            );
        }

        return {
            message: 'Order marked as dropped at vendor and status updated to IN_PROGRESS',
            data: {
                orderId: order.id,
                status: OrderStatus.IN_PROGRESS,
                updatedAt: new Date(),
            },
        };
    }

    /**
     * Mark order ready for delivery on behalf of vendor (triggers READY_FOR_PICKUP)
     * Equivalent to: PATCH /vendor/:orderId/READY_FOR_PICKUP
     */
    async markReadyForDelivery(orderId: string, adminUser: User): Promise<UpdateOrderStatusResponseDTO> {
        console.log(typeof adminUser);

        const order = await this._dbService.order.findUnique({
            where: { id: orderId },
            include: {
                user: { select: { id: true } },
                laundry: { select: { lat: true, long: true, name: true } },
            },
        });

        if (!order) {
            throw new BadRequestException('Order not found');
        }

        if (order.status !== OrderStatus.IN_PROGRESS) {
            throw new BadRequestException('Order must be in IN_PROGRESS status');
        }

        // Update order status to READY_FOR_PICKUP
        await this._dbService.order.update({
            where: { id: orderId },
            data: { status: OrderStatus.READY_FOR_PICKUP },
        });

        // Add status history
        await this._dbService.orderStatusHistory.create({
            data: {
                orderId: orderId,
                status: OrderStatus.READY_FOR_PICKUP,
                timestamp: new Date(),
            },
        });

        // Find closest available delivery driver
        const availableDrivers = await this._dbService.userLocation.findMany({
            where: {
                user: {
                    type: 'RIDER',
                    status: 'ACTIVE',
                    deletedAt: null,
                },
            },
            include: {
                user: true,
            },
        });

        if (availableDrivers.length === 0) {
            throw new BadRequestException('No available drivers found for delivery');
        }

        // Calculate distances and find closest to laundry location
        let closestDriver = availableDrivers[0];
        let minDistance = this.calculateDistance(
            order.laundry.lat,
            order.laundry.long,
            closestDriver.lat,
            closestDriver.long,
        );

        for (const driver of availableDrivers.slice(1)) {
            const distance = this.calculateDistance(order.laundry.lat, order.laundry.long, driver.lat, driver.long);
            if (distance < minDistance) {
                minDistance = distance;
                closestDriver = driver;
            }
        }

        // Create delivery rider assignment
        await this._dbService.riderOrder.create({
            data: {
                orderId: orderId,
                riderId: closestDriver.userId,
                type: RiderOrderType.RIDER_DELIVERY,
            },
        });

        // Update delivery with assigned rider
        await this._dbService.delivery.update({
            where: { orderId: orderId },
            data: { riderId: closestDriver.userId },
        });

        // Notify assigned delivery driver
        if (closestDriver.userId) {
            await this._notificationService.SendMultilingualNotificationToUser(
                closestDriver.userId,
                'NEW_DELIVERY_REQUEST',
                {
                    orderId: order.id,
                    key: 'GET_ORDER_BY_ID',
                    route: 'RideDetails',
                },
            );
        }

        // Notify customer
        if (order.user.id) {
            await this._notificationService.SendMultilingualNotificationToUser(
                order.user.id,
                'ORDER_READY_FOR_PICKUP',
                {
                    orderId: order.id,
                    key: 'GET_ORDER_BY_ID',
                    route: 'TrackOrder',
                },
            );
        }

        return {
            message: 'Order marked as ready for delivery on behalf of vendor',
            data: {
                orderId: order.id,
                status: OrderStatus.READY_FOR_PICKUP,
                updatedAt: new Date(),
            },
        };
    }

    /**
     * Accept delivery ride on behalf of driver
     */
    async acceptDeliveryRide(orderId: string, adminUser: User): Promise<UpdateOrderStatusResponseDTO> {
        console.log(typeof adminUser);
        console.log('I raaaaaaaan');
        try {
            const order = await this._dbService.order.findUnique({
                where: { id: orderId },
                include: {
                    delivery: { select: { riderId: true, status: true } },
                },
            });

            if (!order) {
                throw new BadRequestException('Order not found');
            }

            if (order.status !== OrderStatus.READY_FOR_PICKUP) {
                throw new BadRequestException('Order must be in READY_FOR_PICKUP status');
            }

            console.log(order.delivery, 'order delivery');

            if (!order.delivery?.riderId) {
                throw new BadRequestException('No delivery driver assigned to this order');
            }

            // Update delivery status to accepted
            await this._dbService.delivery.update({
                where: { orderId: orderId },
                data: { status: 'ACCEPTED' },
            });

            return {
                message: 'Delivery ride accepted successfully on behalf of driver',
                data: {
                    orderId: order.id,
                    status: order.status,
                    updatedAt: new Date(),
                },
            };
        } catch (error) {
            console.log(error, ' :::Error during acception of delivery ride');
        }
    }

    /**
     * Mark order as delivered to customer (triggers COMPLETED) on behalf of driver
     * Equivalent to: PATCH /rider/:orderId/DROPPED_OFF (for delivery)
     */
    async markDeliveredToCustomer(orderId: string, adminUser: User): Promise<UpdateOrderStatusResponseDTO> {
        console.log(typeof adminUser);

        const order = await this._dbService.order.findUnique({
            where: { id: orderId },
            include: {
                user: { select: { id: true } },
            },
        });

        if (!order) {
            throw new BadRequestException('Order not found');
        }

        if (order.status !== OrderStatus.READY_FOR_PICKUP) {
            throw new BadRequestException('Order must be in READY_FOR_PICKUP status');
        }

        // Update delivery status
        await this._dbService.delivery.update({
            where: { orderId: orderId },
            data: { status: 'DELIVERED_TO_USER' },
        });

        // Update order status to COMPLETED
        await this._dbService.order.update({
            where: { id: orderId },
            data: { status: OrderStatus.COMPLETED },
        });

        // Add status history
        await this._dbService.orderStatusHistory.create({
            data: {
                orderId: orderId,
                status: OrderStatus.COMPLETED,
                timestamp: new Date(),
            },
        });

        // Notify customer
        if (order.user.id) {
            await this._notificationService.SendMultilingualNotificationToUser(order.user.id, 'ORDER_COMPLETED', {
                orderId: order.id,
                key: 'GET_ORDER_BY_ID',
                route: 'Orders',
            });
        }

        return {
            message: 'Order marked as delivered and completed successfully',
            data: {
                orderId: order.id,
                status: OrderStatus.COMPLETED,
                updatedAt: new Date(),
            },
        };
    }

    /**
     * Add admin notes to order
     */
    async addOrderNotes(orderId: string, notes: string, adminUser: User): Promise<AddOrderNotesResponseDTO> {
        const order = await this._dbService.order.findUnique({
            where: { id: orderId },
        });

        if (!order) {
            throw new BadRequestException('Order not found');
        }

        // Update order with admin notes
        const currentNotes = order.adminNotes || '';
        const adminName = adminUser.name || 'NIL';
        const newNote = `(Admin: ${adminName}): ${notes}`;
        const updatedNotes = currentNotes ? `${currentNotes}\n\n${newNote}` : newNote;

        await this._dbService.order.update({
            where: { id: orderId },
            data: { adminNotes: updatedNotes },
        });

        return {
            message: 'Admin notes added successfully',
            data: {
                orderId: order.id,
                notes: newNote,
                addedBy: adminName,
                addedAt: new Date(),
            },
        };
    }

    /**
     * Accept order on behalf of vendor (assigns driver and updates status)
     * Equivalent to: PATCH /vendor/:orderId/ACCEPTED
     */

    async acceptOrder(orderId: string, adminUser: User): Promise<UpdateOrderStatusResponseDTO> {
        console.log(typeof adminUser);
        const order = await this._dbService.order.findUnique({
            where: { id: orderId },

            include: {
                laundry: {
                    select: {
                        id: true,
                        name: true,
                        lat: true,
                        long: true,
                        vendorId: true,
                    },
                },

                pickup: {
                    select: {
                        pickupLat: true,
                        pickupLong: true,
                    },
                },

                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });

        if (!order) {
            throw new BadRequestException('Order does not exist');
        }

        if (order.status !== OrderStatus.PENDING) {
            throw new BadRequestException(`Order is already ${order.status}. Can only accept PENDING orders`);
        }

        if (!order.laundry) {
            throw new BadRequestException('Order must have a laundry assigned');
        }

        // Find closest available driver

        const availableDrivers = await this._dbService.userLocation.findMany({
            where: {
                user: {
                    type: 'RIDER',

                    status: 'ACTIVE',

                    deletedAt: null,
                },
            },

            include: {
                user: true,
            },
        });

        if (availableDrivers.length === 0) {
            throw new BadRequestException('No available drivers found');
        }

        // Calculate distances and find closest

        let closestDriver = availableDrivers[0];

        let minDistance = this.calculateDistance(
            order.pickup.pickupLat,

            order.pickup.pickupLong,

            closestDriver.lat,

            closestDriver.long,
        );

        for (const driver of availableDrivers.slice(1)) {
            const distance = this.calculateDistance(
                order.pickup.pickupLat,

                order.pickup.pickupLong,

                driver.lat,

                driver.long,
            );

            if (distance < minDistance) {
                minDistance = distance;

                closestDriver = driver;
            }
        }

        // Create rider assignment

        await this._dbService.riderOrder.create({
            data: {
                orderId: orderId,

                riderId: closestDriver.userId,

                type: RiderOrderType.RIDER_PICKUP,
            },
        });

        // Update pickup with assigned rider

        await this._dbService.pickup.update({
            where: { orderId: orderId },

            data: { riderId: closestDriver.userId },
        });

        // Update order status to ACCEPTED

        await this._dbService.order.update({
            where: { id: orderId },

            data: { status: OrderStatus.ACCEPTED },
        });

        // Create status history

        await this._dbService.orderStatusHistory.create({
            data: {
                orderId,

                status: OrderStatus.ACCEPTED,

                timestamp: new Date(),
            },
        });

        // Notify customer

        if (order.user.id) {
            await this._notificationService.SendMultilingualNotificationToUser(
                order.user.id,

                'ORDER_ACCEPTED',

                {
                    orderId: order.id,

                    key: 'GET_ORDER_BY_ID',

                    route: 'TrackOrder',
                },
            );
        }

        // Notify assigned driver

        if (closestDriver.userId) {
            await this._notificationService.SendMultilingualNotificationToUser(
                closestDriver.userId,
                'NEW_PICKUP_REQUEST',
                {
                    orderId: order.id,
                    key: 'GET_ORDER_BY_ID',
                    route: 'RideDetails',
                },
            );
        }

        return {
            message: 'Order accepted successfully on behalf of vendor',
            data: {
                orderId: order.id,
                status: OrderStatus.ACCEPTED,
                updatedAt: new Date(),
            },
        };
    }

    /**
     * Cancel order on behalf of admin
     */

    async cancelOrder(
        orderId: string,
        reason: string,
        refundCustomer?: boolean,
    ): Promise<UpdateOrderStatusResponseDTO> {
        const order = await this._dbService.order.findUnique({
            where: { id: orderId },

            include: {
                user: true,

                payment: true,
            },
        });

        if (!order) {
            throw new BadRequestException('Order not found');
        }

        if (order.status === OrderStatus.CANCELLED) {
            throw new BadRequestException('Order already cancelled');
        }

        await this._dbService.$transaction(async (tx) => {
            await tx.order.update({
                where: { id: orderId },

                data: {
                    status: OrderStatus.CANCELLED,

                    cancelReason: reason,
                },
            });

            await tx.orderStatusHistory.create({
                data: {
                    orderId,

                    status: OrderStatus.CANCELLED,

                    timestamp: new Date(),
                },
            });

            if (order.paid && refundCustomer) {
                await tx.order.update({
                    where: { id: orderId },
                    data: {
                        paid: false,
                        paymentStatus: 'REFUNDED',
                    },
                });

                if (order.payment) {
                    await tx.payment.update({
                        where: { orderId },

                        data: {
                            status: 'REFUNDED',

                            type: 'Refund',
                        },
                    });
                }
            }
        });

        // Notify customer
        if (order.user.id) {
            await this._notificationService.SendMultilingualNotificationToUser(
                order.user.id,

                'ORDER_REJECTED',

                {
                    orderId: order.id,

                    key: 'GET_ORDER_BY_ID',

                    route: 'TrackOrder',
                },
            );
        }

        return {
            message: 'Order cancelled successfully',
            data: {
                orderId: order.id,
                status: OrderStatus.CANCELLED,
                updatedAt: new Date(),
            },
        };
    }

    // Helper method to calculate distance between two points (Haversine formula)
    private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Earth's radius in km
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private deg2rad(deg: number): number {
        return deg * (Math.PI / 180);
    }
}
