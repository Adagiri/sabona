import { ApiProperty } from "@nestjs/swagger";
import { CouponType } from "@prisma/client";
import { IsBoolean, IsDate, IsEnum, IsNumber, IsOptional, IsString } from "class-validator";

export class GetAllCouponsResponseDTO {
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
    @IsDate()
    startDate: Date;

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
}

export class GetAllCouponsResponseArrayDTO {
    @ApiProperty({ type: [GetAllCouponsResponseDTO] })
    data: GetAllCouponsResponseDTO[];
}