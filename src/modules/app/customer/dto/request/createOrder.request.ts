import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export default class CreateOrderRequestDTO {
    @ApiProperty()
    @IsNumber()
    totalAmount: number;

    @ApiProperty()
    @IsString()
    pickupAddress: string;

    @ApiProperty()
    @IsNumber()
    pickupLat: number;

    @ApiProperty()
    @IsNumber()
    pickupLong: number;

    @ApiProperty()
    @IsString()
    deliveryAddress: string;

    @ApiProperty()
    @IsNumber()
    deliveryLat: number;

    @ApiProperty()
    @IsNumber()
    deliveryLong: number;

}
