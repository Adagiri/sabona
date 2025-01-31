import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsString } from "class-validator";

export class ValidateCouponRequestDTO {
    @ApiProperty()
    @IsString()
    code: string
}

export class ValidateCouponQueryRequestDTO{
    @ApiProperty({ required: false }) 
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    cartAmount?: number;
}