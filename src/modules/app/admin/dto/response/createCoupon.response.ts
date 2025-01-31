import { ApiProperty } from "@nestjs/swagger";
import { CouponType } from "@prisma/client";
import { IsString, IsBoolean, IsOptional, IsNumber, IsDate, isNumber, IsEnum } from "class-validator";

export class CreateCouponResponseDTO {
    @ApiProperty()
    @IsString()
    id: string;

    @ApiProperty()
    @IsString()
    code: string;

    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty()
    @IsNumber()
    discount: number;

    @ApiProperty()
    @IsEnum(CouponType)
    type: CouponType;

    @ApiProperty()
    @IsOptional()
    @IsNumber()
    maxDiscount: number | null;

    @ApiProperty()
    @IsOptional()
    @IsNumber()
    minOrderAmount: number;

    @ApiProperty()
    @IsDate()
    expiryDate: Date;

    @ApiProperty()
    @IsBoolean()
    isActive: boolean;

    @ApiProperty()
    @IsOptional()
    @IsNumber()
    usageLimit: number | null;

    @ApiProperty()
    @IsBoolean()
    singleUse: boolean;

    @ApiProperty()
    @IsDate()
    createdAt: Date;

    @ApiProperty()
    @IsDate()
    updatedAt: Date;
}
