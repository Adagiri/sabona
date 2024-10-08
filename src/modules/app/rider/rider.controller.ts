import { Param } from '@nestjs/common';
import { ApiController, Authorized, CurrentUser, Get, Patch } from '../../../core/decorators';
import RiderService from './rider.service';
import { User } from '@prisma/client';
import CreateOrderResponseDTO from '../customer/dto/response/createOrder.response';
import GetOrderByIdRequestDTO from '../customer/dto/request/getOrderById.request';
import UpdateStatusRequestDTO from './dto/request/updateStatus.request';
import GetRideRequestsResponseDTO from './dto/response/getRideRequests.response';
import UpdateOrderStatusResponseDTO from './dto/response/updateOrderStatus.response';
import GetDeliveriesResponseDTO from './dto/response/getDeliveries.response';

@ApiController({
    path: '/rider',
    tag: 'rider',
    version: '1',
})

export default class RiderController {
    constructor(private _riderService: RiderService) {}

    @Authorized()
    @Get({
        path: '/rideRequests',
        description: 'Get all ride requests',
        response: GetRideRequestsResponseDTO
    })
    async getRideRequests(@CurrentUser() user: User): Promise<GetRideRequestsResponseDTO> {
        return await this._riderService.getRideRequests(user);
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
        path: '/orders/:id',
        description: 'Get order by id',
        response: CreateOrderResponseDTO
    })
    async getOrderById(@Param() params:GetOrderByIdRequestDTO, @CurrentUser() user: User): Promise<CreateOrderResponseDTO> {
        return await this._riderService.getOrderById(params, user);
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
    
}