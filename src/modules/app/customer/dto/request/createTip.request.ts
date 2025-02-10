import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString } from "class-validator";

export class CreateTipDTO {
    @ApiProperty()
    @IsString()
    orderId: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    pickupRiderId?: string;
    
    @ApiProperty()
    @IsNumber()
    @IsOptional()
    pickupRiderAmount?: number;
    
    @ApiProperty()
    @IsString()
    @IsOptional()
    deliveryRiderId?: string;

    @ApiProperty()
    @IsNumber()
    @IsOptional()
    deliveryRiderAmount?: number;
}