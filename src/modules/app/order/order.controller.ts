import { ApiController, Authorized, CurrentUser, Get } from "src/core/decorators";
import { Param } from "@nestjs/common";
import getOrderByIdRequestDTO from "./dto/request/getOrderById.request";
import GetOrderByIdResponsetDTO from "./dto/response/getOrderById.response";
import OrderService from "./order.service";
import { GetOrderStatusProgressResponseDTO } from "./dto/response/getOrderStatusProgress.response";
import { User } from "@prisma/client";
@ApiController({
    path: '/order',
    tag: 'order',
    version: '1',
})
export default class OrderController {
    constructor(private _orderService: OrderService) {}

    @Authorized()
    @Get({
        path: '/:id',
        description: 'Get order by id',
        response: GetOrderByIdResponsetDTO,
    })
    async getOrderById(@Param() params: getOrderByIdRequestDTO): Promise<GetOrderByIdResponsetDTO> {
        return await this._orderService.getOrderById(params.id);
    }

    @Authorized()
    @Get({
        path: '/:id/status-progress',
        description: 'Get order status progression with boolean flags for each step',
        response: GetOrderStatusProgressResponseDTO,
    })
    async getOrderStatusProgress(
        @Param() params: getOrderByIdRequestDTO,
        @CurrentUser() user: User,
    ): Promise<GetOrderStatusProgressResponseDTO> {
        return await this._orderService.getOrderStatusProgress(params.id, user);
    }
}