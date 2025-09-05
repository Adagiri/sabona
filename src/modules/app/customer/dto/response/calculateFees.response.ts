import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceChargeType } from '@prisma/client';
import { IsOptional } from 'class-validator';

export class FeeBreakdownDTO {
    @ApiProperty()
    baseDeliveryFee: number;

    @ApiProperty()
    distance: number;

    @ApiProperty()
    distanceDeliveryFee: number;

    @ApiProperty({ required: false })
    expressMultiplier?: number;

    @ApiProperty()
    serviceChargeRate: number;

    @ApiProperty()
    serviceChargeType: ServiceChargeType;

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
    vatFee: number;

    @ApiProperty()
    vatPercentage: number;

    @ApiPropertyOptional()
    @IsOptional()
    couponCode: string;

    @ApiProperty()
    discountAmount: number;

    @ApiProperty()
    preDiscountAmount: number;

    @ApiProperty()
    postDiscountAmount: number;

    @ApiProperty()
    finalAmount: number;

    @ApiProperty()
    breakdown: FeeBreakdownDTO;
}

export class CalculateFeesResponseDTO {
    @ApiProperty()
    data: CalculateFeesDataDTO;
}
