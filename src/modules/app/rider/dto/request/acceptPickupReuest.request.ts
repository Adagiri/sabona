import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export default class AcceptPickupRequestDTO {
    @ApiProperty()
    @IsString()
    orderId: string;
}