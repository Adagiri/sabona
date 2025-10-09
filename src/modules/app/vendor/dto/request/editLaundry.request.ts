import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { LaundryNameTranslationDTO, LaundryAddressTranslationDTO } from './createLaundry.request';

export default class EditLaundryRequestDTO {
    @ApiProperty({ type: LaundryNameTranslationDTO, required: false })
    @IsOptional()
    nameLocale?: LaundryNameTranslationDTO;

    @ApiProperty({ type: LaundryAddressTranslationDTO, required: false })
    @IsOptional()
    addressLocale?: LaundryAddressTranslationDTO;
}
