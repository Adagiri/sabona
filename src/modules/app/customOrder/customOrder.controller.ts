import { Body, Param, Query } from '@nestjs/common';
import { User, UserType } from '@prisma/client';
import { ApiController, Authorized, CurrentUser, Get, Post } from '../../../core/decorators';
import CustomOrderService from './customOrder.service';
import { CreateCustomOrderRequestDTO } from './dto/request/createCustomOrder.request';
import { CreateCustomOrderResponseDTO } from './dto/response/createCustomOrder.response';
import { ValidateCustomLocationRequestDTO } from './dto/request/validateCustomLocation.request';
import { ValidateCustomLocationResponseDTO } from './dto/response/validateCustomLocation.response';
import { GetCustomOrderStatsResponseDTO } from './dto/response/customOrderStats.response';

@ApiController({
    path: '/custom-order',
    tag: 'custom-order',
    version: '1',
})
export default class CustomOrderController {
    constructor(private _customOrderService: CustomOrderService) {}

    @Authorized()
    @Post({
        path: '/create',
        description: 'Create custom order for non-registered laundry',
        response: CreateCustomOrderResponseDTO,
    })
    async createCustomOrder(
        @Body() data: CreateCustomOrderRequestDTO,
        @CurrentUser() user: User,
    ): Promise<CreateCustomOrderResponseDTO> {
        const orderData = {
            orderType: 'CUSTOM_LAUNDRY' as any,
            customLaundryName: data.customLaundryName,
            customLaundryDescription: data.customLaundryDescription,
            customLaundryLat: data.customLaundryLat,
            customLaundryLong: data.customLaundryLong,
            customLaundryAddress: data.customLaundryAddress,
            pickupAddress: data.pickupAddress,
            pickupLat: data.pickupLat,
            pickupLong: data.pickupLong,
            pickupTime: data.pickupTime,
            pickupDate: data.pickupDate,
            deliveryAddress: data.deliveryAddress,
            deliveryLat: data.deliveryLat,
            deliveryLong: data.deliveryLong,
            deliveryDate: data.deliveryDate,
            deliveryType: data.deliveryType,
            paymentType: data.paymentType,
            totalAmount: data.totalAmount,
        };

        return await this._customOrderService.createCustomOrder(orderData as any, user);
    }

    @Authorized()
    @Post({
        path: '/validate-location',
        description: 'Validate custom laundry location and check for nearby registered laundries',
        response: ValidateCustomLocationResponseDTO,
    })
    async validateCustomLocation(
        @Body() data: ValidateCustomLocationRequestDTO,
    ): Promise<ValidateCustomLocationResponseDTO> {
        return await this._customOrderService.validateCustomLaundryLocation(data.lat, data.long);
    }

    // Admin-only endpoints for custom order management
    @Authorized(UserType.ADMIN)
    @Get({
        path: '/admin/all',
        description: 'Get all custom orders for admin review',
        response: {},
    })
    async getCustomOrdersForAdmin(): Promise<any> {
        return await this._customOrderService.getCustomOrdersForAdmin();
    }

    @Authorized(UserType.ADMIN)
    @Get({
        path: '/admin/stats',
        description: 'Get custom order statistics',
        response: GetCustomOrderStatsResponseDTO,
    })
    async getCustomOrderStats(): Promise<GetCustomOrderStatsResponseDTO> {
        return await this._customOrderService.getCustomOrderStats();
    }

    @Authorized(UserType.ADMIN)
    @Get({
        path: '/admin/search',
        description: 'Search custom orders by customer info',
        response: {},
    })
    async searchCustomOrders(@Query('q') query: string): Promise<any> {
        return await this._customOrderService.searchCustomOrders(query);
    }

    @Authorized(UserType.ADMIN)
    @Get({
        path: '/admin/:orderId',
        description: 'Get custom order details by ID',
        response: {},
    })
    async getCustomOrderById(@Param('orderId') orderId: string): Promise<any> {
        return await this._customOrderService.getCustomOrderById(orderId);
    }

    // @Authorized(UserType.ADMIN)
    // @Get({
    //     path: '/admin/custom-order/:orderId',
    //     description: 'Get custom order details by ID (frontend-specific endpoint)',
    //     response: {},
    // })
    // async getCustomOrderByIdForAdmin(@Param('orderId') orderId: string): Promise<any> {
    //     return await this._customOrderService.getCustomOrderById(orderId);
    // }
}
