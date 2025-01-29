import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";

export class ValidateCouponResponseDTO {
    @ApiProperty()
    @IsString()
    id: string;

    @ApiProperty()
    @IsString()
    code: string;

    @ApiProperty()
    @IsOptional()
    @IsNumber()
    maxDiscount: number | null;

    @ApiProperty()
    @IsBoolean()
    singleUse: boolean;
}
