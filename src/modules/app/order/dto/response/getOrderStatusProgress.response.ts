import { ApiProperty } from '@nestjs/swagger';

export class OrderStatusProgressDto {
    @ApiProperty()
    ORDER_PLACED: boolean;

    @ApiProperty()
    ORDER_PAID: boolean;

    @ApiProperty()
    ORDER_ACCEPTED: boolean;

    @ApiProperty()
    ORDER_PROCESSING: boolean;

    @ApiProperty()
    ORDER_REJECTED: boolean;

    @ApiProperty()
    ORDER_PICKED_UP: boolean;

    @ApiProperty()
    ORDER_DELIVERED: boolean;

    @ApiProperty()
    FEEDBACK_SUBMITTED: boolean;
}

export class OrderDetailsDto {
    @ApiProperty()
    totalAmount: number;

    @ApiProperty()
    orderNumber: string;

    @ApiProperty()
    createdAt: Date;
}

export class GetOrderStatusProgressResponseDTO {
    @ApiProperty()
    orderId: string;

    @ApiProperty()
    currentStatus: string;

    @ApiProperty({ type: OrderStatusProgressDto })
    statusProgression: OrderStatusProgressDto;

    @ApiProperty({ type: OrderDetailsDto })
    orderDetails: OrderDetailsDto;
}
