import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, isArray, IsNumber, IsString } from 'class-validator';


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
    @ApiProperty()
    @IsString()
    laundryId: string;

    @ApiProperty()
    @IsNumber()
    totalAmount: number;

    @ApiProperty({ type: [OrderServiceDTO] })
    @Type(() => OrderServiceDTO)
    @IsArray()
    services: OrderServiceDTO[];

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





