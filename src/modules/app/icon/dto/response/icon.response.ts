import { IsString, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { IconType } from '@prisma/client'; // Import from Prisma instead of defining custom enum
import { Type } from 'class-transformer';

export class MediaDTO {
    @IsNumber()
    id: number;

    @IsString()
    path: string;

    @IsString()
    name: string;
}

export class IconDTO {
    @IsNumber()
    id: number;

    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    type: IconType; // Use Prisma-generated enum

    @ValidateNested()
    @Type(() => MediaDTO)
    media: MediaDTO;

    @IsString()
    createdAt: Date;

    @IsString()
    updatedAt: Date;

    @IsOptional()
    _count?: {
        laundryServices: number;
        laundryCategories: number;
    };
}

export class IconResponseDTO {
    @ValidateNested()
    @Type(() => IconDTO)
    data: IconDTO;
}

export class GetAllIconsResponseDTO {
    @ValidateNested({ each: true })
    @Type(() => IconDTO)
    data: IconDTO[];
}

export class IconMessageResponseDTO {
    @IsString()
    message: string;
}
