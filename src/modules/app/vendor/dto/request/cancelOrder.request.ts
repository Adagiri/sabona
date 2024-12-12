import { ApiProperty } from "@nestjs/swagger";
import { OrderStatus } from "@prisma/client";
import { IsString } from "class-validator";

export default class CancelOrderRequestDTO {
    @ApiProperty()
    @IsString()
    orderId: string;
}