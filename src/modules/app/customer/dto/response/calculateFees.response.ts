import { ApiProperty } from '@nestjs/swagger';
// Remove the ResponseSchema import since it doesn't exist

export class FeeBreakdownDTO {
    @ApiProperty()
    baseDeliveryFee: number;

    @ApiProperty()
    distanceDeliveryFee: number;

    @ApiProperty({ required: false })
    expressMultiplier?: number;

    @ApiProperty()
    serviceChargeRate: number;

    @ApiProperty()
    vatRate: number;
}

export class CalculateFeesDataDTO {
    @ApiProperty()
    subtotal: number;

    @ApiProperty()
    serviceCharge: number;

    @ApiProperty()
    deliveryFee: number;

    @ApiProperty()
    vatAmount: number;

    @ApiProperty()
    total: number;

    @ApiProperty()
    distance: number;

    @ApiProperty()
    breakdown: FeeBreakdownDTO;
}

export class CalculateFeesResponseDTO {
    @ApiProperty()
    data: CalculateFeesDataDTO;
}
