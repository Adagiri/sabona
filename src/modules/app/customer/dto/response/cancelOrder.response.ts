import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export default class CancelOrderResponseDTO {
    @ApiProperty()
    @IsString()
    id: string
    
    @ApiProperty()
    @IsString()
    status: string

    @ApiProperty()
    @IsString()
    userId: string

}