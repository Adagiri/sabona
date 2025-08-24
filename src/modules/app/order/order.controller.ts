import { ApiController, Authorized, Get } from "src/core/decorators";
import { Param } from "@nestjs/common";
import getOrderByIdRequestDTO from "./dto/request/getOrderById.request";
import GetOrderByIdResponsetDTO from "./dto/response/getOrderById.response";
import OrderService from "./order.service";
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
        return await this._orderService.getOrderById(params.id)
    }
}