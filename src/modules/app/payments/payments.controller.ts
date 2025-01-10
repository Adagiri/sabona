import { ApiController, Authorized, Get, Post } from "src/core/decorators";
import PaymentsService from "./payments.service";
import { Body } from "@nestjs/common";
import CreatePaymentRequestDTO from "./dto/request/createPayment.request";

@ApiController({
    path: '/payment',
    tag: 'payment',
    version: '1',
})
export default class PaymentsController {
    constructor(private _paymentsService: PaymentsService) {}

    // @Authorized()
    @Post({
        path: '/create',
        description: 'Create payment',
        response:''
       })
    async createPayment(@Body() data: CreatePaymentRequestDTO): Promise<any> {
        return await this._paymentsService.createPayment(data);
    }

}
