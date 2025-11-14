import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ItemNameTranslationDTO } from './createLaundryServiceItem.request';

export class EditLaundryServiceItemRequestDTO {
    @ApiProperty({ type: ItemNameTranslationDTO, required: false })
    @IsOptional()
    nameLocale?: ItemNameTranslationDTO;

    @ApiProperty()
    @IsNumber()
    platformPrice: number;

    @ApiProperty()
    @IsNumber()
    vendorPrice: number;

    @ApiProperty()
    @IsNumber()
    expressPrice: number;

    @ApiProperty()
    @IsOptional()
    @IsNumber()
    price: number;

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
