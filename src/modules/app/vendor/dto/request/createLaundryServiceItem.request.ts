import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsString, IsOptional, ValidateNested, IsObject } from 'class-validator';

export class ItemNameTranslationDTO {
    @ApiProperty({ example: 'T-Shirt' })
    @IsString()
    @IsNotEmpty()
    en: string;

    @ApiProperty({ example: 'تي شيرت' })
    @IsString()
    @IsNotEmpty()
    ar: string;

    [key: string]: string;
}

export class CreateLaundryServiceItemRequestDTO {
    @ApiProperty({ type: ItemNameTranslationDTO })
    @IsObject()
    nameLocale: ItemNameTranslationDTO;

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
}

export class CreateLaundryServiceItemsArrayDTO {
    @ApiProperty({ type: [CreateLaundryServiceItemRequestDTO] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateLaundryServiceItemRequestDTO)
    items: CreateLaundryServiceItemRequestDTO[];
}
