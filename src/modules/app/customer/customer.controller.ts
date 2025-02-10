import { User, UserType } from '@prisma/client';
import { ApiController, Authorized, CurrentUser, Get, Patch, Post } from '../../../core/decorators';
import CustomerService from './customer.service';
import { Body, Param, Query } from '@nestjs/common';
import CreateOrderResponseDTO from './dto/response/createOrder.response';
import CreateOrderRequestDTO from './dto/request/createOrder.request';
import AcceptOrderRequestDTO from '../vendor/dto/request/acceptOrder.request';
import CancelOrderResponseDTO from './dto/response/cancelOrder.response';
import { OrderListDto } from './dto/response/orderlist.response.dto';
import CreateFeedbackDTO from './dto/request/createFeeback.request';
import CreateFeedbackResponseDTO from './dto/response/createFeedback.response';
import { HasFeedBackRequestDTO } from './dto/request/hasFeedback.request';
import { HasFeedbackResponseDTO } from './dto/response/hasFeedback.response.dto';
import { ValidateCouponQueryRequestDTO, ValidateCouponRequestDTO } from './dto/request/validateCoupon.request';
import { ValidateCouponResponseDTO } from './dto/response/validateCoupon.response';
import { getUserCouponsQueryDTO } from './dto/request/getUserCoupons.request';
import { GetUserCouponsResponseDTO } from './dto/response/getUserCoupons.response';
import { CreateTipDTO } from './dto/request/createTip.request';
import { HasTippedResponseDTO } from './dto/response/hasTipped.response';
import { AddTipResponseDto } from './dto/response/addTip.response';

@ApiController({
    path: '/customer',
    tag: 'customer',
    version: '1',
})
export default class CustomerController {
    constructor(private _customerService: CustomerService) { }

    @Authorized()
    @Post({
        path: '/createOrder',
        description: 'Create order',
        response: CreateOrderResponseDTO,
    })
    async CreateOrder(
        @Body() data: CreateOrderRequestDTO,
        @CurrentUser() user: User): Promise<CreateOrderResponseDTO> {
        return await this._customerService.CreateOrder(data, user)
    }

    @Authorized()
    @Patch({
        path: '/:orderId/cancel',
        description: 'Cancel order',
        response: CancelOrderResponseDTO
    })
    async CancelOrder(
        @Param() params: AcceptOrderRequestDTO,
        @CurrentUser() user: User): Promise<CancelOrderResponseDTO> {
        return await this._customerService.CancelOrder(params, user)
    }

    @Authorized()
    @Get({
        path: '/orders',
        description: 'Get all user orders',
        response: OrderListDto,
    })
    async GetOrders(
        @CurrentUser() user: User): Promise<OrderListDto> {
        return await this._customerService.GetOrders(user)
    }


    @Authorized()
    @Post({
        path: '/add-feedback',
        description: 'Create Feedback',
        response: CreateFeedbackResponseDTO,
    })
    async AddFeedback(
        @Body() data: CreateFeedbackDTO,
        @CurrentUser() user: User): Promise<CreateFeedbackResponseDTO> {
        return await this._customerService.AddFeedback(data, user)
    }

    @Authorized()
    @Get({
        path: '/has-feedbacks/:orderId',
        description: 'Check if user has feedbacks',
        response: HasFeedbackResponseDTO,
    })
    async HasFeedbacks(
        @CurrentUser() user: User,
        @Param() params: HasFeedBackRequestDTO)
        : Promise<HasFeedbackResponseDTO> {
        return await this._customerService.HasFeedback(params, user)
    }

    @Authorized()
    @Get({
        path: '/validateCoupon/:code',
        description: 'Validate coupon',
        response: ValidateCouponResponseDTO,
    })
    async validateCoupon(
        @CurrentUser() user: User,
        @Param() params:ValidateCouponRequestDTO,
        @Query() query: ValidateCouponQueryRequestDTO): Promise<ValidateCouponResponseDTO> {
        return await this._customerService.validateCoupon(user, params, query)
    }

    @Authorized()
    @Get({
        path: '/coupons',
        description: 'Get all user coupons',
        response: GetUserCouponsResponseDTO,
    })
    async GetUserCoupons(
        @CurrentUser() user: User,
        @Query() query: getUserCouponsQueryDTO,
    ) : Promise<GetUserCouponsResponseDTO> {
        return await this._customerService.getUserCoupons(user, query)
    }

    @Authorized(UserType.USER)
    @Post({
        path: '/addTip',
        description: 'Add Tip',
        response: CreateFeedbackResponseDTO,
    })
    async AddTip(
        @Body() data: CreateTipDTO,
        @CurrentUser() user: User): Promise<AddTipResponseDto> {
        return await this._customerService.AddTip(data, user)
    }

    @Authorized()
    @Get({
        path: '/has-tipped/:orderId',
        description: 'Check if user has tipped',
        response: HasTippedResponseDTO,
    })
    async HasTipped(
        @CurrentUser() user: User,
        @Param() params: HasFeedBackRequestDTO)
        : Promise<HasTippedResponseDTO> {
        return await this._customerService.HasTipped(params, user)
    }

    

}