import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export default class GetOrderRequestDTO {
    @ApiProperty()
    @IsString()
    laundryId: string;
}