import { ApiProperty } from "@nestjs/swagger";
import { OrderStatus } from "@prisma/client";
import { IsString } from "class-validator";

export default class UpdateStatusRequestDTO {

    @ApiProperty()
    @IsString()
    orderId: string;

    @ApiProperty()
    @IsString()
    status: OrderStatus;
}