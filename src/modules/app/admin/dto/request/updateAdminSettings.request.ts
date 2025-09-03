import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateAdminSettingsRequestDTO {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    vatRate?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    vatEnabled?: boolean;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    serviceChargeType?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    serviceChargeRate?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    customOrderServiceChargeRate?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    deliveryBaseRate?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    deliveryPerKmRate?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    freeDeliveryThreshold?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    expressMultiplier?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    maxDeliveryDistance?: number;
}
