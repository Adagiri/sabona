import { ApiProperty } from '@nestjs/swagger';
import { DeliveryType, PaymentType, OrderType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNumber, IsOptional, IsString, ValidateIf } from 'class-validator';

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

export default class CreateOrderRequestDTO {
    // NEW: Order type field
    @ApiProperty({ enum: OrderType, description: 'Type of order - registered or custom laundry' })
    @IsEnum(OrderType)
    orderType: OrderType;

    // UPDATED: Make laundryId conditional based on order type
    @ApiProperty({ required: false, description: 'Required for REGISTERED_LAUNDRY orders' })
    @ValidateIf((o) => o.orderType === OrderType.REGISTERED_LAUNDRY)
    @IsString()
    laundryId?: string;

    // UPDATED: Make services conditional based on order type
    @ApiProperty({ type: [OrderServiceDTO], required: false, description: 'Required for REGISTERED_LAUNDRY orders' })
    @ValidateIf((o) => o.orderType === OrderType.REGISTERED_LAUNDRY)
    @Type(() => OrderServiceDTO)
    @IsArray()
    services?: OrderServiceDTO[];

    // NEW: Custom laundry fields
    @ApiProperty({ required: false, description: 'Optional for CUSTOM_LAUNDRY orders' })
    @ValidateIf((o) => o.orderType === OrderType.CUSTOM_LAUNDRY)
    @IsString()
    customLaundryName?: string;

    @ApiProperty({
        required: false,
        description: 'Required for CUSTOM_LAUNDRY orders - detailed description of items/needs',
    })
    @ValidateIf((o) => o.orderType === OrderType.CUSTOM_LAUNDRY)
    @IsString()
    customLaundryDescription?: string;

    @ApiProperty({ required: false, description: 'Required for CUSTOM_LAUNDRY orders - vendor latitude' })
    @ValidateIf((o) => o.orderType === OrderType.CUSTOM_LAUNDRY)
    @IsNumber()
    customLaundryLat?: number;

    @ApiProperty({ required: false, description: 'Required for CUSTOM_LAUNDRY orders - vendor longitude' })
    @ValidateIf((o) => o.orderType === OrderType.CUSTOM_LAUNDRY)
    @IsNumber()
    customLaundryLong?: number;

    @ApiProperty({ required: false, description: 'Optional for CUSTOM_LAUNDRY orders - vendor address' })
    @ValidateIf((o) => o.orderType === OrderType.CUSTOM_LAUNDRY)
    @IsString()
    @IsOptional()
    customLaundryAddress?: string;

    @ApiProperty({ required: false, description: 'Admin-set service charge for custom orders' })
    @ValidateIf((o) => o.orderType === OrderType.CUSTOM_LAUNDRY)
    @IsNumber()
    @IsOptional()
    adminServiceCharge?: number;

    // Existing fields
    @ApiProperty()
    @IsNumber()
    totalAmount: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    baseAmount?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    discountAmount?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    couponCode?: string;

    @ApiProperty({ enum: PaymentType })
    @IsEnum(PaymentType)
    paymentType: PaymentType;

    // Pickup details (required for all orders)
    @ApiProperty({ description: 'Customer pickup address' })
    @IsString()
    pickupAddress: string;

    @ApiProperty({ description: 'Customer pickup latitude' })
    @IsNumber()
    pickupLat: number;

    @ApiProperty({ description: 'Customer pickup longitude' })
    @IsNumber()
    pickupLong: number;

    @ApiProperty({ description: 'Pickup time' })
    @IsString()
    pickupTime: string;

    @ApiProperty({ description: 'Pickup date' })
    @IsString()
    pickupDate: string;

    // Delivery details (required for all orders)
    @ApiProperty({ description: 'Customer delivery address' })
    @IsString()
    deliveryAddress: string;

    @ApiProperty({ description: 'Customer delivery latitude' })
    @IsNumber()
    deliveryLat: number;

    @ApiProperty({ description: 'Customer delivery longitude' })
    @IsNumber()
    deliveryLong: number;

    @ApiProperty({ required: false, description: 'Delivery date' })
    @IsString()
    @IsOptional()
    deliveryDate?: string;

    @ApiProperty({ enum: DeliveryType })
    @IsEnum(DeliveryType)
    deliveryType: DeliveryType;
}
