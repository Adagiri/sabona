import { ApiProperty } from '@nestjs/swagger';
import { CouponType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CouponNameTranslationDTO {
    @ApiProperty({ example: 'Summer Sale' })
    @IsString()
    @IsNotEmpty()
    en: string;

    @ApiProperty({ example: 'تخفيضات الصيف' })
    @IsString()
    @IsNotEmpty()
    ar: string;

    [key: string]: string;
}

export class CreateCouponRequest {
    @ApiProperty({
        description: 'The unique code for the coupon.',
        example: 'SABONAH_123',
    })
    @IsString()
    code: string;

    @ApiProperty({ type: CouponNameTranslationDTO })
    nameLocale: CouponNameTranslationDTO;

    @ApiProperty({
        example: 'PERCENTAGE',
    })
    @IsEnum(CouponType)
    type: CouponType;

    @ApiProperty({
        description: 'The discount percentage for the coupon.',
        example: 50,
    })
    @IsNumber()
    discount: number;

    @ApiProperty({
        description: 'The maximum discount value for percentage-based coupons.',
        example: 100,
    })
    @IsOptional()
    @IsNumber()
    maxDiscount: number;

    @ApiProperty()
    @IsNumber()
    @IsOptional()
    minOrderAmount: number;

    @ApiProperty()
    @Type(() => Date)
    @IsDate()
    expiryDate: Date;

    @ApiProperty({
        description: 'The maximum number of times this coupon can be used.',
        example: 100,
    })
    @IsNumber()
    @IsOptional()
    usageLimit: number;

    @ApiProperty({
        description: 'Whether the coupon is single-use per user.',
        example: false,
    })
    @IsOptional()
    @IsBoolean()
    singleUse: boolean;

    @ApiProperty()
    @IsOptional()
    startDate: Date;

    @ApiProperty()
    @IsOptional()
    @IsBoolean()
    isActive: boolean;
}
