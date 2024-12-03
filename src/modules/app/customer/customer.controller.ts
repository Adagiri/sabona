import { User } from '@prisma/client';
import { ApiController, Authorized, CurrentUser, Get, Patch, Post } from '../../../core/decorators';
import CustomerService from './customer.service';
import { Body, Param } from '@nestjs/common';
import CreateOrderResponseDTO from './dto/response/createOrder.response';
import CreateOrderRequestDTO from './dto/request/createOrder.request';
import GetAllCustomerOrdersResponseDTO from './dto/response/getAllCustomerOrders';
import GetOrderByIdRequestDTO from './dto/request/getOrderById.request';
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
    @Get({
        path: '/orders',
        description: 'Get all user orders',
        response: GetAllCustomerOrdersResponseDTO,
    })
    async GetAllOrders(
        @CurrentUser() user: User): Promise<GetAllCustomerOrdersResponseDTO> {
        return await this._customerService.GetAllOrders(user)
    }

    @Authorized()
    @Get({
        path: '/orders/:id',
        description: 'Get order by id',
        response: CreateOrderResponseDTO,
    })
    async GetOrderById(
         @Param() params: GetOrderByIdRequestDTO): Promise<CreateOrderResponseDTO> {
        return await this._customerService.GetOrderById(params)
    }

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