import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsOptional, IsString } from "class-validator";


export class ApproveApplicationDTO {
    @ApiProperty()
    @IsString()
    userId: string;
}