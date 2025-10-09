import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt } from 'class-validator';
import { ServiceNameTranslationDTO, ServiceDescriptionTranslationDTO } from './createLaundry.request';

export default class EditLaundryServiceRequestDTO {
    @ApiProperty({ type: ServiceNameTranslationDTO, required: false })
    @IsOptional()
    nameLocale?: ServiceNameTranslationDTO;

    @ApiProperty({ type: ServiceDescriptionTranslationDTO, required: false })
    @IsOptional()
    descriptionLocale?: ServiceDescriptionTranslationDTO;

    @ApiProperty({ description: 'Media ID for SVG icon', required: false })
    @IsInt()
    @IsOptional()
    iconId?: number;
}
