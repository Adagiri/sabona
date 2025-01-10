import { ApiProperty } from '@nestjs/swagger';
import { DeliveryType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';


// pickupRiderRating,
//     deliveryRiderRating,
//     vendorRating,
//     orderId,
//     pickupRiderFeedback,
//     deliveryRiderFeedback,
//     vendorFeedback,

export default class CreateFeedbackDTO {
    @ApiProperty()
    @IsString()
    orderId: string;

    @ApiProperty()
    @IsNumber()
    @IsOptional()
    deliveryRiderRating?: number;
    
    @ApiProperty()
    @IsNumber()
    @IsOptional()
    vendorRating?: number;
    
    @ApiProperty()
    @IsNumber()
    @IsOptional()
    pickupRiderRating?: number;

    @ApiProperty()
    @IsString()
    @IsOptional()
    pickupRiderFeedback?: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    deliveryRiderFeedback?: string;
 
    @ApiProperty()
    @IsString()
    @IsOptional()
    vendorFeedback?: string;
    
    @ApiProperty()
    @IsString()
    @IsOptional()
    vendorOrderId?: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    laundryId?: string;
    
    @ApiProperty()
    @IsString()
    @IsOptional()
    pickupRiderOrderId?: string;
    
    @ApiProperty()
    @IsString()
    @IsOptional()
    deliveryRiderOrderId?: string;

}