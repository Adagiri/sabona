import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, IsEmail } from 'class-validator';
import { LaundryNameTranslationDTO, LaundryAddressTranslationDTO } from './createLaundry.request';

export default class EditLaundryRequestDTO {
    @ApiProperty({ type: LaundryNameTranslationDTO, required: false })
    @IsOptional()
    nameLocale?: LaundryNameTranslationDTO;

    @ApiProperty({ type: LaundryAddressTranslationDTO, required: false })
    @IsOptional()
    addressLocale?: LaundryAddressTranslationDTO;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    lat?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    long?: number;

    // Vendor details
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    vendorName?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsEmail()
    vendorEmail?: string;
}
