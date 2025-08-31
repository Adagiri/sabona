import { ApiProperty } from '@nestjs/swagger';

export default class PaymentWebhookResponseDTO {
    @ApiProperty()
    success: boolean;

    @ApiProperty()
    message: string;

    @ApiProperty({ required: false })
    orderId?: string;
}
