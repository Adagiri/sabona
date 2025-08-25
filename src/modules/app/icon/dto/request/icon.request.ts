import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { IconType } from '@prisma/client';

export class CreateIconRequestDTO {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsNumber()
    mediaId: number;

    @IsEnum(IconType)
    type: IconType;
}

export class UpdateIconRequestDTO {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsNumber()
    mediaId?: number;

    @IsOptional()
    @IsEnum(IconType)
    type?: IconType;
}
