import { ApiProperty } from '@nestjs/swagger';
import { CouponType, Prisma } from '@prisma/client';
import { IsString, IsBoolean, IsOptional, IsNumber, IsDate, IsEnum, IsJSON } from 'class-validator';

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

    @ApiProperty({ required: false, type: 'object' })
    @IsOptional()
    @IsJSON()
    nameLocale: Prisma.JsonValue | null;

    @ApiProperty()
    @IsNumber()
    discount: number;

    @ApiProperty({ enum: CouponType })
    @IsEnum(CouponType)
    type: CouponType;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    maxDiscount: number | null;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    minOrderAmount: number | null;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsDate()
    startDate: Date | null;

    @ApiProperty()
    @IsDate()
    expiryDate: Date;

    @ApiProperty()
    @IsBoolean()
    isActive: boolean;

    @ApiProperty({ required: false })
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
