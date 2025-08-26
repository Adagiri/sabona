import { ApiProperty } from '@nestjs/swagger';

class CustomOrderEstimate {
    @ApiProperty({ description: 'Estimated total cost in SAR' })
    estimatedCost: number;

    @ApiProperty({ description: 'Estimation explanation' })
    description: string;

    @ApiProperty({ description: 'Distance to custom vendor in km' })
    customLaundryDistance: number;

    @ApiProperty({ description: 'Delivery fee in SAR' })
    deliveryFee: number;
}

class CreatedCustomOrder {
    @ApiProperty()
    id: string;

    @ApiProperty()
    orderNumber: number;

    @ApiProperty()
    userId: string;

    @ApiProperty()
    orderType: string;

    @ApiProperty()
    status: string;

    @ApiProperty()
    customLaundryName: string;

    @ApiProperty()
    customLaundryDescription: string;

    @ApiProperty()
    totalAmount: number;

    @ApiProperty()
    createdAt: Date;
}

export class CreateCustomOrderResponseDTO {
    @ApiProperty({ type: CreatedCustomOrder })
    data: CreatedCustomOrder;

    @ApiProperty({ type: CustomOrderEstimate })
    estimate: CustomOrderEstimate;

    @ApiProperty()
    message: string;
}
