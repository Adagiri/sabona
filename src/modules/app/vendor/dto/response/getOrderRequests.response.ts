import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString } from "class-validator";

class PickupDTO {
    @ApiProperty()
    @IsString()
    id: string;

    @ApiProperty()
    @IsString()
    pickupAddress: string;

    @ApiProperty()
    @IsNumber()
    pickupLat: number;

    @ApiProperty()
    @IsNumber()
    pickupLong: number;
}

class deliveryDTO {
    @ApiProperty()
    @IsString()
    id: string;

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

class userDTO {
    @ApiProperty()
    @IsString()
    id: string;

    @ApiProperty()
    @IsString()
    firstName: string;

    @ApiProperty()
    @IsString()
    lastName: string;

    @ApiProperty()
    @IsString()
    email: string;

    @ApiProperty()
    @IsString()
    phone: string;
}

class GetOrderRequestsDTO {
    @ApiProperty()
    @IsString()
    id: string;

    @ApiProperty()
    @IsString()
    userId: string;

    @ApiProperty()
    @IsNumber()
    totalAmount: number;

    @ApiProperty()
    pickup?: PickupDTO

    @ApiProperty()
    delivery?: deliveryDTO

    @ApiProperty()
    user: userDTO
}

export default class GetOrderRequestsResponseDTO {
    @ApiProperty({type : [GetOrderRequestsDTO]})
    data: GetOrderRequestsDTO[];
}