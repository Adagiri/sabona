import { ApiProperty } from '@nestjs/swagger';
import { DeviceType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export default class CreateDeviceRequestDTO {
    @ApiProperty({ enum: DeviceType })
    @IsEnum(DeviceType)
    @IsNotEmpty()
    type: DeviceType;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    userId: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    userAgent?: string;
}

export class CreateFCMTokenRequestDTO {
    @ApiProperty({ type: 'integer' })
    @Type(() => Number)
    @IsInt()
    @IsNotEmpty()
    deviceId: number;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    token: string;
}
