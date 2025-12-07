import { Param } from '@nestjs/common';
import { ApiController, Authorized, CurrentUser, Delete, Get, Patch } from '../../../core/decorators';
import RiderService from './rider.service';
import { User } from '@prisma/client';
import UpdateStatusRequestDTO from './dto/request/updateStatus.request';
import GetRideRequestsResponseDTO from './dto/response/getRideRequests.response';
import UpdateOrderStatusResponseDTO from './dto/response/updateOrderStatus.response';
import GetDeliveriesResponseDTO from './dto/response/getDeliveries.response';
import CancelOrderRequestDTO from './dto/request/src/modules/app/rider/dto/request/cancelOrderRequest';
import { BooleanResponseDTO } from 'src/core/response/response.schema';

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
        description: 'Get requests and rides (lightweight)',
        response: GetRideRequestsResponseDTO,
    })
    async getRideRequests(@CurrentUser() user: User): Promise<GetRideRequestsResponseDTO> {
        return await this._riderService.getRides(user);
    }

    @Authorized()
    @Get({
        path: '/rides/:rideId',
        description: 'Get single ride with full order details',
        response: {},
    })
    async getRideById(@Param('rideId') rideId: string, @CurrentUser() user: User): Promise<any> {
        return await this._riderService.getRideById(rideId, user);
    }

    @Authorized()
    @Patch({
        path: '/:orderId/cancel',
        description: 'Cancel order',
        response: UpdateOrderStatusResponseDTO,
    })
    async cancelOrder(
        @Param() params: CancelOrderRequestDTO,
        @CurrentUser() user: User,
    ): Promise<UpdateOrderStatusResponseDTO> {
        return await this._riderService.cancelOrder(params, user);
    }

    @Authorized()
    @Patch({
        path: '/:orderId/:status',
        description: 'Update order status',
        response: UpdateOrderStatusResponseDTO,
    })
    async updateOrderStatus(
        @Param() params: UpdateStatusRequestDTO,
        @CurrentUser() user: User,
    ): Promise<UpdateOrderStatusResponseDTO> {
        return await this._riderService.updateOrderStatus(params, user);
    }

    @Authorized()
    @Get({
        path: '/deliveries',
        description: 'Get all rider deliveries',
        response: GetDeliveriesResponseDTO,
    })
    async getDeliveries(@CurrentUser() user: User): Promise<GetDeliveriesResponseDTO> {
        return await this._riderService.getDeliveries(user);
    }

    @Authorized()
    @Get({
        path: '/currentOrders',
        description: 'Get current orders',
        response: GetDeliveriesResponseDTO,
    })
    async getCurrentOrders(@CurrentUser() user: User): Promise<GetDeliveriesResponseDTO> {
        return await this._riderService.getCurrentOrders(user);
    }

    @Authorized()
    @Get({
        path: '/lastOrder',
        description: 'Get last order',
        response: {},
    })
    async getLastOrder(@CurrentUser() user: User): Promise<any> {
        return await this._riderService.getLastOrder(user);
    }

    @Authorized()
    @Delete({
        path: '/account/delete',
        description: 'Delete rider account',
        response: BooleanResponseDTO,
    })
    async deleteMyAccount(@CurrentUser() user: User): Promise<BooleanResponseDTO> {
        return await this._riderService.deleteMyAccount(user);
    }
}