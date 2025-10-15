import { IsOptional, IsNumber } from 'class-validator';
import { CategoryNameTranslationDTO, CategoryDescriptionTranslationDTO } from './createLaundryItemCategory.request';
import { ApiProperty } from '@nestjs/swagger';

export class EditLaundryItemCategoryRequestDTO {
    @ApiProperty({ type: CategoryNameTranslationDTO, required: false })
    @IsOptional()
    nameLocale?: CategoryNameTranslationDTO;

    @ApiProperty({ type: CategoryDescriptionTranslationDTO, required: false })
    @IsOptional()
    descriptionLocale?: CategoryDescriptionTranslationDTO;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    iconId?: number;
}
