import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsString, IsOptional, ValidateNested } from 'class-validator';

export class CreateLaundryServiceItemRequestDTO {
    @ApiProperty()
    @IsString()
    name: string;

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
