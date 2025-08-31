import { Body, Headers } from '@nestjs/common';
import { ApiController, Post } from '../../../core/decorators';
import PayTabsService, { PayTabsWebhookData } from './paytabs.service';
import PaymentWebhookResponseDTO from './dto/response/paymentWebhook.response';

@ApiController({
    path: '/webhook',
    tag: 'Payment Webhooks',
    version: '1',
})
export default class PayTabsController {
    constructor(private _payTabsService: PayTabsService) {}

    @Post({
        path: '/paytabs',
        description: 'Handle PayTabs payment webhooks for all order types',
        response: PaymentWebhookResponseDTO,
    })
    async handlePayTabsWebhook(
        @Body() webhookData: PayTabsWebhookData,
        @Headers() headers: any,
    ): Promise<PaymentWebhookResponseDTO> {

        console.log(webhookData)
        return await this._payTabsService.handleWebhook(webhookData, headers);
    }
}
