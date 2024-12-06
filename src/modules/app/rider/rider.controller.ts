import { Param } from '@nestjs/common';
import { ApiController, Authorized, CurrentUser, Get, Patch } from '../../../core/decorators';
import RiderService from './rider.service';
import { User } from '@prisma/client';
import UpdateStatusRequestDTO from './dto/request/updateStatus.request';
import GetRideRequestsResponseDTO from './dto/response/getRideRequests.response';
import UpdateOrderStatusResponseDTO from './dto/response/updateOrderStatus.response';
import GetDeliveriesResponseDTO from './dto/response/getDeliveries.response';
import CancelOrderRequestDTO from './dto/request/src/modules/app/rider/dto/request/cancelOrderRequest';

@ApiController({
    path: '/rider',
    tag: 'rider',
    version: '1',
})

export default class RiderController {
    constructor(private _riderService: RiderService) {}

    @Authorized()
    @Get({
        path: '/rides',
        description: 'Get requests and rides',
        response: GetRideRequestsResponseDTO
    })
    async getRideRequests(@CurrentUser() user: User): Promise<GetRideRequestsResponseDTO> {
        return await this._riderService.getRides(user);
    }

    @Authorized()
    @Patch({
        path: '/:orderId/cancel',
        description: 'Cancel order',
        response: UpdateOrderStatusResponseDTO
    })
    async cancelOrder(@Param() params:CancelOrderRequestDTO, @CurrentUser() user: User): Promise<UpdateOrderStatusResponseDTO> {
        return await this._riderService.cancelOrder(params, user);
    }

    @Authorized()
    @Patch({
        path: '/:orderId/:status',
        description: 'Update order status',
        response: UpdateOrderStatusResponseDTO
    })
    async updateOrderStatus(@Param() params:UpdateStatusRequestDTO, @CurrentUser() user: User): Promise<UpdateOrderStatusResponseDTO> {
        return await this._riderService.updateOrderStatus(params, user);
    }

    @Authorized()
    @Get({
        path: '/deliveries',
        description: 'Get all rider deliveries',
        response: GetDeliveriesResponseDTO
    })
    async getDeliveries(@CurrentUser() user: User): Promise<GetDeliveriesResponseDTO> {
        return await this._riderService.getDeliveries(user);
    }

    @Authorized()
    @Get({
        path: '/currentOrders',
        description: 'Get current orders',
        response: GetDeliveriesResponseDTO
    })
    async getCurrentOrders(@CurrentUser() user: User): Promise<GetDeliveriesResponseDTO> {
        return await this._riderService.getCurrentOrders(user);
    }

    
    
}