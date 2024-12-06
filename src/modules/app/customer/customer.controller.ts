import { User } from '@prisma/client';
import { ApiController, Authorized, CurrentUser, Patch, Post } from '../../../core/decorators';
import CustomerService from './customer.service';
import { Body, Param } from '@nestjs/common';
import CreateOrderResponseDTO from './dto/response/createOrder.response';
import CreateOrderRequestDTO from './dto/request/createOrder.request';
import AcceptOrderRequestDTO from '../vendor/dto/request/acceptOrder.request';
import CancelOrderResponseDTO from './dto/response/cancelOrder.response';

@ApiController({
    path: '/customer',
    tag: 'customer',
    version: '1',
})
export default class CustomerController {
    constructor(private _customerService: CustomerService) {}

    // @Authorized()
    // @Post({
    //     path: '/createOrder',
    //     description: 'Create order',
    //     response: CreateOrderResponseDTO,
    // })
    // async CreateOrder(
    //     @Body() data: CreateOrderRequestDTO, 
    //     @CurrentUser() user: User): Promise<CreateOrderResponseDTO> {
    //     return await this._customerService.CreateOrder(data, user)
    // }

    @Authorized()
    @Patch({
        path: '/:orderId/cancel',
        description: 'Cancel order',
        response : CancelOrderResponseDTO
    })
    async CancelOrder(
        @Param() params: AcceptOrderRequestDTO,
        @CurrentUser() user: User): Promise<CancelOrderResponseDTO> {
            return await this._customerService.CancelOrder(params, user)
    }
    

}