import { ApiProperty } from "@nestjs/swagger";
import { CouponType } from "@prisma/client";
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from "class-validator";

export class GetUserCouponsResponse {
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
    @IsEnum(CouponType)
    type: CouponType;

    @ApiProperty()
    @IsNumber()
    discount: number;

    @ApiProperty()
    @IsNumber()
    @IsOptional()
    minOrderAmount?: number;

    @ApiProperty()
    @IsNumber()
    @IsOptional()
    maxDiscount?: number;

    @ApiProperty()
    @IsBoolean()
    @IsOptional()
    singleUse?: boolean;

    @ApiProperty()
    @IsNumber()
    @IsOptional()
    usageLimit?: number;
}


export class GetUserCouponsResponseDTO {
    totalCoupons: number;
    vouchers: GetUserCouponsResponse[];
}