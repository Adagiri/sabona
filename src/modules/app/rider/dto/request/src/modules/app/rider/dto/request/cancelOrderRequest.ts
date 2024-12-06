import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export default class CancelOrderRequestDTO {
    @ApiProperty()
    @IsString()
    orderId: string;
}