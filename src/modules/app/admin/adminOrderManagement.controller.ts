import { User, UserType } from '@prisma/client';
import { ApiController, Authorized, CurrentUser, Patch } from '../../../core/decorators';
import AdminOrderManagementService from './adminOrderManagement.service';
import { UpdateOrderStatusResponseDTO, AddOrderNotesResponseDTO } from './dto/response/updateOrderStatus.response';
import { AddOrderNotesRequestDTO } from './dto/request/updateOrderStatus.request';
import { Body, Param } from '@nestjs/common';

/**
 * Admin Controller - Order Management Endpoints
 *
 * These endpoints allow admin to perform actions on behalf of vendors and drivers.
 * All endpoints require ADMIN authorization.
 *
 * Order Flow:
 * 1. PENDING → ACCEPTED (vendor accepts or admin on behalf)
 * 2. ACCEPTED → Driver accepts pickup
 * 3. ACCEPTED → Driver picks up from customer
 * 4. ACCEPTED → Driver drops at vendor → IN_PROGRESS
 * 5. IN_PROGRESS → Vendor marks ready → READY_FOR_PICKUP
 * 6. READY_FOR_PICKUP → Driver accepts delivery
 * 7. READY_FOR_PICKUP → Driver delivers → COMPLETED
 */

@ApiController({
    path: '/admin',
    tag: 'admin-order-management',
    version: '1',
})
export default class AdminOrderManagementController {
    constructor(private _adminOrderService: AdminOrderManagementService) {}

    // ============================================================================
    // DRIVER PICKUP ACTIONS (on behalf of pickup driver)
    // ============================================================================

    /**
     * Accept pickup ride on behalf of driver
     * Equivalent to driver calling: PATCH /rider/:orderId/ACCEPT
     */
    @Authorized(UserType.ADMIN)
    @Patch({
        path: '/order/:orderId/driver-accept-pickup',
        description: 'Accept pickup ride on behalf of driver',
        response: UpdateOrderStatusResponseDTO,
    })
    async acceptPickupRide(
        @Param('orderId') orderId: string,
        @CurrentUser() adminUser: User,
    ): Promise<UpdateOrderStatusResponseDTO> {
        return await this._adminOrderService.acceptPickupRide(orderId, adminUser);
    }

    /**
     * Mark order as picked up from customer on behalf of driver
     * Equivalent to driver calling: PATCH /rider/:orderId/PICKED_UP
     */
    @Authorized(UserType.ADMIN)
    @Patch({
        path: '/order/:orderId/driver-picked-up',
        description: 'Mark order as picked up from customer on behalf of driver',
        response: UpdateOrderStatusResponseDTO,
    })
    async markPickedUp(
        @Param('orderId') orderId: string,
        @CurrentUser() adminUser: User,
    ): Promise<UpdateOrderStatusResponseDTO> {
        return await this._adminOrderService.markPickedUp(orderId, adminUser);
    }

    /**
     * Mark items dropped off at vendor on behalf of driver (triggers IN_PROGRESS)
     * Equivalent to driver calling: PATCH /rider/:orderId/DROPPED_OFF (for pickup)
     */
    @Authorized(UserType.ADMIN)
    @Patch({
        path: '/order/:orderId/driver-dropped-at-vendor',
        description: 'Mark items dropped off at vendor on behalf of driver (triggers IN_PROGRESS)',
        response: UpdateOrderStatusResponseDTO,
    })
    async markDroppedAtVendor(
        @Param('orderId') orderId: string,
        @CurrentUser() adminUser: User,
    ): Promise<UpdateOrderStatusResponseDTO> {
        return await this._adminOrderService.markDroppedAtVendor(orderId, adminUser);
    }

    // ============================================================================
    // VENDOR ACTIONS (on behalf of vendor)
    // ============================================================================

    /**
     * Mark order ready for delivery on behalf of vendor (triggers READY_FOR_PICKUP)
     * Equivalent to vendor calling: PATCH /vendor/:orderId/READY_FOR_PICKUP
     */
    @Authorized(UserType.ADMIN)
    @Patch({
        path: '/order/:orderId/mark-ready',
        description: 'Mark order ready for delivery on behalf of vendor (triggers READY_FOR_PICKUP)',
        response: UpdateOrderStatusResponseDTO,
    })
    async markReadyForDelivery(
        @Param('orderId') orderId: string,
        @CurrentUser() adminUser: User,
    ): Promise<UpdateOrderStatusResponseDTO> {
        return await this._adminOrderService.markReadyForDelivery(orderId, adminUser);
    }

    // ============================================================================
    // DRIVER DELIVERY ACTIONS (on behalf of delivery driver)
    // ============================================================================

    /**
     * Accept delivery ride on behalf of driver
     */
    @Authorized(UserType.ADMIN)
    @Patch({
        path: '/order/:orderId/driver-accept-delivery',
        description: 'Accept delivery ride on behalf of driver',
        response: UpdateOrderStatusResponseDTO,
    })
    async acceptDeliveryRide(
        @Param('orderId') orderId: string,
        @CurrentUser() adminUser: User,
    ): Promise<UpdateOrderStatusResponseDTO> {
        return await this._adminOrderService.acceptDeliveryRide(orderId, adminUser);
    }

    /**
     * Mark order as delivered to customer on behalf of driver (triggers COMPLETED)
     * Equivalent to driver calling: PATCH /rider/:orderId/DROPPED_OFF (for delivery)
     */
    @Authorized(UserType.ADMIN)
    @Patch({
        path: '/order/:orderId/driver-delivered',
        description: 'Mark order as delivered to customer on behalf of driver (triggers COMPLETED)',
        response: UpdateOrderStatusResponseDTO,
    })
    async markDeliveredToCustomer(
        @Param('orderId') orderId: string,
        @CurrentUser() adminUser: User,
    ): Promise<UpdateOrderStatusResponseDTO> {
        return await this._adminOrderService.markDeliveredToCustomer(orderId, adminUser);
    }

    // ============================================================================
    // ADMIN NOTES
    // ============================================================================

    /**
     * Add admin notes to order
     */
    @Authorized(UserType.ADMIN)
    @Patch({
        path: '/order/:orderId/notes',
        description: 'Add admin notes to order',
        response: AddOrderNotesResponseDTO,
    })
    async addOrderNotes(
        @Param('orderId') orderId: string,
        @Body() data: AddOrderNotesRequestDTO,
        @CurrentUser() adminUser: User,
    ): Promise<AddOrderNotesResponseDTO> {
        return await this._adminOrderService.addOrderNotes(orderId, data.notes, adminUser);
    }
}
