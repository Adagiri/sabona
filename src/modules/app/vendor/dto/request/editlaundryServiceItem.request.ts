import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ItemNameTranslationDTO } from './createLaundryServiceItem.request';

export class EditLaundryServiceItemRequestDTO {
    @ApiProperty({ type: ItemNameTranslationDTO, required: false })
    @IsOptional()
    nameLocale?: ItemNameTranslationDTO;

    @ApiProperty()
    @IsNumber()
    @IsOptional()
    platformPrice?: number;

    @ApiProperty()
    @IsNumber()
    @IsOptional()
    vendorPrice?: number;

    @ApiProperty({ description: 'What vendor receives for express delivery' })
    @IsNumber()
    @IsOptional()
    expressVendorPrice?: number;

    @ApiProperty({ description: 'What user pays for express delivery' })
    @IsNumber()
    @IsOptional()
    expressPlatformPrice?: number;

    @ApiProperty()
    @IsOptional()
    @IsNumber()
    price?: number;

    @ApiProperty({ description: 'Category ID for this item', required: false })
    @IsString()
    @IsOptional()
    categoryId?: string;

    @ApiProperty({ description: 'Subcategory ID for this item', required: false })
    @IsString()
    @IsOptional()
    subCategoryId?: string;

    @ApiProperty({ description: 'Sort order for this item within its category', required: false })
    @IsNumber()
    @IsOptional()
    sortOrder?: number;
}
