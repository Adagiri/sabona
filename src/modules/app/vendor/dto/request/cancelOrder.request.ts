import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export default class CancelOrderRequestDTO {
    @ApiProperty()
    @IsString()
    orderId: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    reason: string;
}