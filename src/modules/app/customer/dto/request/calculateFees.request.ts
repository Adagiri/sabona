import { ApiProperty } from '@nestjs/swagger';
import { DeliveryType, OrderType } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, ValidateIf } from 'class-validator';

export class CalculateFeesRequestDTO {
    @ApiProperty({ enum: OrderType })
    @IsEnum(OrderType)
    orderType: OrderType;

    @ApiProperty()
    @IsNumber()
    subtotal: number;

    @ApiProperty({ enum: DeliveryType })
    @IsEnum(DeliveryType)
    deliveryType: DeliveryType;

    @ApiProperty()
    @IsNumber()
    pickupLat: number;

    @ApiProperty()
    @IsNumber()
    pickupLong: number;

    @ApiProperty()
    @IsNumber()
    deliveryLat: number;

    @ApiProperty()
    @IsNumber()
    deliveryLong: number;

    @ApiProperty({ required: false })
    @ValidateIf((o) => o.orderType === OrderType.CUSTOM_LAUNDRY)
    @IsOptional()
    @IsNumber()
    customServiceCharge?: number;
}
