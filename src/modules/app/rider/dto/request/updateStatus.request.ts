import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export default class UpdateStatusRequestDTO {

    @ApiProperty()
    @IsString()
    orderId: string;

    @ApiProperty()
    @IsString()
    status: 'ACCEPT' | 'PICKED_UP' | 'DROPPED_OFF' ;
}