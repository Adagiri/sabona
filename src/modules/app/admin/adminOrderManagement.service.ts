import { Injectable } from '@nestjs/common';
import { BadRequestException } from 'src/core/exceptions/response.exception';
import DatabaseService from '../../../database/database.service';
import NotificationService from '../notification/notification.service';
import { OrderStatus, OrderType, User } from '@prisma/client';
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
        console.log(typeof adminUser)
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
            await this._notificationService.SendMultilingualNotificationToUser(
                order.user.id,
                'ORDER_PICKED_UP',
                {
                    orderId: order.id,
                    key: 'GET_ORDER_BY_ID',
                    route: 'TrackOrder',
                },
            );
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

        // Find closest delivery driver and assign
        // Note: You'll need to import LocationService for this
        // For now, we'll create the assignment without auto-finding driver
        // The admin can manually assign a delivery driver

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
            await this._notificationService.SendMultilingualNotificationToUser(
                order.user.id,
                'ORDER_COMPLETED',
                {
                    orderId: order.id,
                    key: 'GET_ORDER_BY_ID',
                    route: 'Orders',
                },
            );
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

}
