import { ApiProperty } from '@nestjs/swagger';
import { DeliveryType, OrderType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNumber, IsOptional, IsString, ValidateNested, Min, Max } from 'class-validator';

export class OrderServiceItemDTO {
    @ApiProperty()
    @IsString()
    id: string;

    @ApiProperty()
    @IsNumber()
    quantity: number;
}

export class OrderServiceDTO {
    @ApiProperty()
    @IsString()
    serviceId: string;

    @ApiProperty({ type: [OrderServiceItemDTO] })
    @Type(() => OrderServiceItemDTO)
    @IsArray()
    items: OrderServiceItemDTO[];
}

export class CalculateFeesRequestDTO {
    @ApiProperty({ enum: OrderType, description: 'Type of order' })
    @IsEnum(OrderType)
    orderType: OrderType;

    // REQUIRED: For registered laundry orders, services with items must be provided
    @ApiProperty({
        type: [OrderServiceDTO],
        description: 'Services with items (REQUIRED for registered laundry orders)',
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderServiceDTO)
    @IsOptional() // Only optional because custom orders don't need this
    services?: OrderServiceDTO[];

    // OPTION 2: Keep backward compatibility - still accept subtotal if provided
    @ApiProperty({
        description: 'Pre-calculated subtotal (legacy support)',
        required: false,
    })
    @IsNumber()
    @IsOptional()
    subtotal?: number;

    @ApiProperty({
        description: 'Custom order amount for custom laundry',
        required: false,
    })
    @IsNumber()
    @IsOptional()
    @Min(10)
    customOrderAmount?: number;

    @ApiProperty({ enum: DeliveryType, description: 'Delivery type' })
    @IsEnum(DeliveryType)
    deliveryType: DeliveryType;

    @ApiProperty({ description: 'Pickup latitude' })
    @IsNumber()
    @Min(-90)
    @Max(90)
    pickupLat: number;

    @ApiProperty({ description: 'Pickup longitude' })
    @IsNumber()
    @Min(-180)
    @Max(180)
    pickupLong: number;

    @ApiProperty({ description: 'Delivery latitude' })
    @IsNumber()
    @Min(-90)
    @Max(90)
    deliveryLat: number;

    @ApiProperty({ description: 'Delivery longitude' })
    @IsNumber()
    @Min(-180)
    @Max(180)
    deliveryLong: number;

    @ApiProperty({
        description: 'Coupon code to apply (optional)',
        required: false,
    })
    @IsString()
    @IsOptional()
    couponCode?: string;

    @ApiProperty({
        description: 'Custom service charge for custom orders',
        required: false,
    })
    @IsNumber()
    @IsOptional()
    @Min(0)
    customServiceCharge?: number;

    @ApiProperty({
        description: 'Laundry ID for validation',
        required: false,
    })
    @IsString()
    @IsOptional()
    laundryId?: string;
}
