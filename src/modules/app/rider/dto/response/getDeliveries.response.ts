import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString } from "class-validator";

class orderDTO {
    @ApiProperty()
    @IsNumber()
    totalAmount: number
}

class GetDeliveriesDTO {
    @ApiProperty()
    @IsString()
    orderId: string
    
    @ApiProperty()
    order: orderDTO
}

export default class GetDeliveriesResponseDTO {
    @ApiProperty()
    data: GetDeliveriesDTO[]
} 