import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsNumber } from 'class-validator';

export class CategoryNameTranslationDTO {
    @ApiProperty({ example: 'Shirts' })
    @IsString()
    @IsNotEmpty()
    en: string;

    @ApiProperty({ example: 'قمصان' })
    @IsString()
    @IsNotEmpty()
    ar: string;

    [key: string]: string;
}

export class CategoryDescriptionTranslationDTO {
    @ApiProperty({ example: 'All types of shirts' })
    @IsString()
    @IsNotEmpty()
    en: string;

    @ApiProperty({ example: 'جميع أنواع القمصان' })
    @IsString()
    @IsNotEmpty()
    ar: string;

    [key: string]: string;
}

export class CreateLaundryItemCategoryRequestDTO {
    @ApiProperty({ type: CategoryNameTranslationDTO })
    nameLocale: CategoryNameTranslationDTO;

    @ApiProperty({ type: CategoryDescriptionTranslationDTO, required: false })
    @IsOptional()
    descriptionLocale?: CategoryDescriptionTranslationDTO;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    iconId?: number;
}
