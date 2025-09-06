import { ApiProperty } from '@nestjs/swagger';
import { DeliveryType, PaymentType } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export class CreateCustomOrderRequestDTO {
    @ApiProperty({ description: 'Name of the custom laundry vendor' })
    @IsString()
    @IsOptional()
    @Length(2, 100, { message: 'Laundry name must be between 2 and 100 characters' })
    customLaundryName: string;

    @ApiProperty({ description: 'Detailed description of laundry needs and items' })
    @IsString()
    @Length(20, 1000, { message: 'Description must be between 20 and 1000 characters' })
    customLaundryDescription: string;

    @ApiProperty({ description: 'Custom laundry latitude (user-pinned location)' })
    @IsNumber()
    @Min(-90, { message: 'Invalid latitude' })
    @Max(90, { message: 'Invalid latitude' })
    customLaundryLat: number;

    @ApiProperty({ description: 'Custom laundry longitude (user-pinned location)' })
    @IsNumber()
    @Min(-180, { message: 'Invalid longitude' })
    @Max(180, { message: 'Invalid longitude' })
    customLaundryLong: number;

    @ApiProperty({ required: false, description: 'Custom laundry address (optional)' })
    @IsOptional()
    @IsString()
    customLaundryAddress?: string;

    @ApiProperty({ description: 'Customer pickup address' })
    @IsString()
    pickupAddress: string;

    @ApiProperty({ description: 'Customer pickup latitude' })
    @IsNumber()
    @Min(-90)
    @Max(90)
    pickupLat: number;

    @ApiProperty({ description: 'Customer pickup longitude' })
    @IsNumber()
    @Min(-180)
    @Max(180)
    pickupLong: number;

    @ApiProperty({ description: 'Pickup time' })
    @IsOptional()
    @IsString()
    pickupTime: string;

    @ApiProperty({ description: 'Pickup date' })
    @IsOptional()
    @IsString()
    pickupDate: string;

    @ApiProperty({ description: 'Customer delivery address' })
    @IsString()
    deliveryAddress: string;

    @ApiProperty({ description: 'Customer delivery latitude' })
    @IsNumber()
    @Min(-90)
    @Max(90)
    deliveryLat: number;

    @ApiProperty({ description: 'Customer delivery longitude' })
    @IsNumber()
    @Min(-180)
    @Max(180)
    deliveryLong: number;

    @ApiProperty({ required: false, description: 'Delivery date' })
    @IsOptional()
    @IsString()
    deliveryDate?: string;

    @ApiProperty({ enum: DeliveryType, description: 'Delivery type (NORMAL or EXPRESS)' })
    @IsOptional()
    @IsEnum(DeliveryType)
    deliveryType: DeliveryType;

    @ApiProperty({ enum: PaymentType, description: 'Payment method' })
    @IsOptional()
    @IsEnum(PaymentType)
    paymentType: PaymentType;

    @ApiProperty({ required: false, description: 'Estimated total amount (optional, system can calculate)' })
    @IsOptional()
    @IsNumber()
    @Min(10, { message: 'Minimum order amount is 10 SAR' })
    totalAmount?: number;
}
