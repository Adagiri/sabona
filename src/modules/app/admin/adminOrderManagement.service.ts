import { Injectable } from '@nestjs/common';
import { BadRequestException } from 'src/core/exceptions/response.exception';
import DatabaseService from '../../../database/database.service';
import NotificationService from '../notification/notification.service';
import { extractTokens } from 'src/helpers/util.helper';
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

        // Get tokens for notifications
        const customerTokens = await this._getDeviceTokens(order.user.id);
        const vendorTokens = order.laundry?.vendorId
            ? await this._getDeviceTokens(order.laundry.vendorId)
            : [];

        // Notify customer
        if (customerTokens.length) {
            await this._notificationService.SendNotificationToMultipleTokens({
                tokens: customerTokens,
                title: 'Driver Confirmed!',
                body: 'Your assigned driver has confirmed and is on the way',
                notificationData: {
                    orderId: order.id,
                    key: 'GET_ORDER_BY_ID',
                    route: 'TrackOrder',
                },
            });

            await this._dbService.notification.create({
                data: {
                    userId: order.user.id,
                    orderId: order.id,
                    message: 'Your assigned driver has confirmed and is on the way (accepted by admin)',
                    status: 'UNREAD',
                    type: 'ORDER_ACCEPTED',
                    data: {
                        orderId: order.id,
                        key: 'GET_ORDER_BY_ID',
                        route: 'TrackOrder',
                    },
                },
            });
        }

        // Notify vendor
        if (vendorTokens.length && order.orderType === OrderType.REGISTERED_LAUNDRY) {
            await this._notificationService.SendNotificationToMultipleTokens({
                tokens: vendorTokens,
                title: 'Driver Confirmed!',
                body: 'Driver is on the way to pick up from customer',
                notificationData: {
                    orderId: order.id,
                    key: 'GET_ORDER_BY_ID',
                    route: 'Track',
                },
            });

            await this._dbService.notification.create({
                data: {
                    userId: order.laundry.vendorId,
                    orderId: order.id,
                    message: 'Driver is on the way to pick up from customer (accepted by admin)',
                    status: 'UNREAD',
                    type: 'ORDER_ACCEPTED',
                    data: {
                        orderId: order.id,
                        key: 'GET_ORDER_BY_ID',
                        route: 'Track',
                    },
                },
            });
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
        const customerTokens = await this._getDeviceTokens(order.user.id);
        if (customerTokens.length) {
            await this._notificationService.SendNotificationToMultipleTokens({
                tokens: customerTokens,
                title: 'Order Picked Up!',
                body: 'Your order has been picked up by the driver',
                notificationData: {
                    orderId: order.id,
                    key: 'GET_ORDER_BY_ID',
                    route: 'TrackOrder',
                },
            });

            await this._dbService.notification.create({
                data: {
                    userId: order.user.id,
                    orderId: order.id,
                    message: 'Your order has been picked up by the driver',
                    status: 'UNREAD',
                    type: 'ORDER_PICKED_UP',
                    data: {
                        orderId: order.id,
                        key: 'GET_ORDER_BY_ID',
                        route: 'TrackOrder',
                    },
                },
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
            const vendorTokens = await this._getDeviceTokens(order.laundry.vendorId);
            if (vendorTokens.length) {
                await this._notificationService.SendNotificationToMultipleTokens({
                    tokens: vendorTokens,
                    title: 'Items Delivered!',
                    body: `Order items have been delivered to ${order.laundry.name}. Please start processing.`,
                    notificationData: {
                        orderId: order.id,
                        key: 'GET_ORDER_BY_ID',
                        route: 'Track',
                    },
                });

                await this._dbService.notification.create({
                    data: {
                        userId: order.laundry.vendorId,
                        orderId: order.id,
                        message: `Order items delivered to your laundry. Please start processing.`,
                        status: 'UNREAD',
                        type: 'ORDER_PROCESSING',
                        data: {
                            orderId: order.id,
                            key: 'GET_ORDER_BY_ID',
                            route: 'Track',
                        },
                    },
                });
            }
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

        // Find closest delivery driver and assign
        // Note: You'll need to import LocationService for this
        // For now, we'll create the assignment without auto-finding driver
        // The admin can manually assign a delivery driver

        // Notify customer
        const customerTokens = await this._getDeviceTokens(order.user.id);
        if (customerTokens.length) {
            await this._notificationService.SendNotificationToMultipleTokens({
                tokens: customerTokens,
                title: 'Order Processed!',
                body: 'Your order is processed and will be delivered soon.',
                notificationData: {
                    orderId: order.id,
                    key: 'GET_ORDER_BY_ID',
                    route: 'TrackOrder',
                },
            });

            await this._dbService.notification.create({
                data: {
                    userId: order.user.id,
                    orderId: order.id,
                    message: 'Your order is processed and will be delivered soon.',
                    status: 'UNREAD',
                    type: 'ORDER_PROCESSING',
                    data: {
                        orderId: order.id,
                        key: 'GET_ORDER_BY_ID',
                        route: 'TrackOrder',
                    },
                },
            });
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
    }

    /**
     * Mark order as delivered to customer (triggers COMPLETED) on behalf of driver
     * Equivalent to: PATCH /rider/:orderId/DROPPED_OFF (for delivery)
     */
    async markDeliveredToCustomer(orderId: string, adminUser: User): Promise<UpdateOrderStatusResponseDTO> {
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
        const customerTokens = await this._getDeviceTokens(order.user.id);
        if (customerTokens.length) {
            await this._notificationService.SendNotificationToMultipleTokens({
                tokens: customerTokens,
                title: 'Order Delivered!',
                body: 'Your order has been delivered successfully. Thank you!',
                notificationData: {
                    orderId: order.id,
                    key: 'GET_ORDER_BY_ID',
                    route: 'Orders',
                },
            });

            await this._dbService.notification.create({
                data: {
                    userId: order.user.id,
                    orderId: order.id,
                    message: 'Your order has been delivered successfully.',
                    status: 'UNREAD',
                    type: 'ORDER_COMPLETED',
                    data: {
                        orderId: order.id,
                        key: 'GET_ORDER_BY_ID',
                        route: 'Orders',
                    },
                },
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
        const timestamp = new Date().toISOString();
        const newNote = `[${timestamp}] (Admin: ${adminUser.firstName} ${adminUser.lastName}): ${notes}`;
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
                addedBy: `${adminUser.firstName} ${adminUser.lastName}`,
                addedAt: new Date(),
            },
        };
    }

    /**
     * Helper method to get device tokens
     */
    private async _getDeviceTokens(userId: string): Promise<string[]> {
        const tokens = await this._dbService.deviceToken.findMany({
            where: { userId, deletedAt: null },
            select: { token: true },
        });
        return extractTokens(tokens);
    }
}
