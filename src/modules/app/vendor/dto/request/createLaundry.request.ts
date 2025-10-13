import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

// Translation DTO for laundry name
export class LaundryNameTranslationDTO {
    @ApiProperty({ example: 'Clean Laundry' })
    @IsString()
    @IsNotEmpty()
    en: string;

    @ApiProperty({ example: 'المغسلة النظيفة' })
    @IsString()
    @IsNotEmpty()
    ar: string;

    [key: string]: string;
}

// Translation DTO for laundry address
export class LaundryAddressTranslationDTO {
    @ApiProperty({ example: '123 Main Street' })
    @IsString()
    @IsNotEmpty()
    en: string;

    @ApiProperty({ example: 'شارع الرئيسي 123' })
    @IsString()
    @IsNotEmpty()
    ar: string;

    [key: string]: string;
}

// Translation DTO for service name
export class ServiceNameTranslationDTO {
    @ApiProperty({ example: 'Wash & Fold' })
    @IsString()
    @IsNotEmpty()
    en: string;

    @ApiProperty({ example: 'غسيل وطي' })
    @IsString()
    @IsNotEmpty()
    ar: string;
    [key: string]: string;
}

// Translation DTO for service description
export class ServiceDescriptionTranslationDTO {
    @ApiProperty({ example: 'Professional wash and fold service' })
    @IsString()
    @IsNotEmpty()
    en: string;

    @ApiProperty({ example: 'خدمة غسيل وطي احترافية' })
    @IsString()
    @IsNotEmpty()
    ar: string;
    [key: string]: string;
}

export class LaundryServiceDTO {
    @ApiProperty({ type: ServiceNameTranslationDTO })
    nameLocale: ServiceNameTranslationDTO;

    @ApiProperty({ type: ServiceDescriptionTranslationDTO, required: false })
    @IsOptional()
    descriptionLocale?: ServiceDescriptionTranslationDTO;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    iconId?: number;
}

export default class CreateLaundryRequestDTO {
    @ApiProperty({ type: LaundryNameTranslationDTO })
    nameLocale: LaundryNameTranslationDTO;

    @ApiProperty({ type: LaundryAddressTranslationDTO })
    addressLocale: LaundryAddressTranslationDTO;

    @ApiProperty({ type: [LaundryServiceDTO], required: false })
    @Type(() => LaundryServiceDTO)
    @IsOptional()
    services?: LaundryServiceDTO[];
}
