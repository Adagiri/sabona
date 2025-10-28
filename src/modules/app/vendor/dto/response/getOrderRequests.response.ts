import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNumber, IsString } from "class-validator";

class LaundryService {
    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty()
    @IsString()
    description: string;
}

class Items {
    @ApiProperty()
    @IsNumber()
    quantity: number;
}

class Services {
    @ApiProperty()
    @IsString()
    laundryServiceId: string;

    @ApiProperty({ type: LaundryService })
    laundryService: LaundryService;

    @ApiProperty({ type: [Items] })
    @IsArray()
    items: Items[];
}

export class GetOrderRequestsDTO {
    @ApiProperty()
    @IsString()
    id: string;

    @ApiProperty()
    @IsString()
    userId: string;

    @ApiProperty()
    @IsNumber()
    orderNumber: number;

    @ApiProperty()
    @IsString()
    deliveryType: string;

    @ApiProperty()
    @IsNumber()
    totalAmount: number;

    @ApiProperty({ type: [Services] })
    @IsArray()
    services: Services[];
}

export default class GetOrderRequestsResponseDTO {
    @ApiProperty({ type: [GetOrderRequestsDTO] })
    data: GetOrderRequestsDTO[];
}
