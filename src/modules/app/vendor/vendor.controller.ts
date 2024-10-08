import { ApiController, Authorized, CurrentUser, Get, Patch } from "src/core/decorators";
import VendorService from "./vendor.service";
import { User } from "@prisma/client";
import GetOrderRequestsResponseDTO from "./dto/response/getOrderRequests.response";
import { Param } from "@nestjs/common";
import UpdateStatusRequestDTO from "./dto/request/updateStatus.request";
import UpdateStatusResponseDTO from "./dto/response/updateStatus.response";

@ApiController({
    path: '/vendor',
    tag: 'vendor',
    version: '1',
})

export default class VendorController {
    constructor(private _vendorService: VendorService) {}

    @Authorized()
    @Get({
        path: '/orderRequests',
        description: 'Get all order requests',
        response: GetOrderRequestsResponseDTO
    })
    async getOrderRequests(@CurrentUser() user: User): Promise<GetOrderRequestsResponseDTO> {
        return await this._vendorService.getOrderRequests()
    }

    @Authorized()
    @Patch({
        path: '/:orderId/:status',
        description: 'Update order status',
        response: UpdateStatusResponseDTO
    })
    async updateOrderStatus(@Param() params:UpdateStatusRequestDTO, @CurrentUser() user: User): Promise<UpdateStatusResponseDTO> {
        return await this._vendorService.updateOrderStatus(params, user)
    }



}