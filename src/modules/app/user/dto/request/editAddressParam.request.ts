import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export default class editAddressParamRequestDTO {
    @ApiProperty()
    @IsString()
    id: string;
}