import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class EditLaundryServiceItemRequestDTO {
    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty()
    @IsNumber()
    platformPrice: number;

    @ApiProperty()
    @IsNumber()
    vendorPrice: number;

    @ApiProperty()
    @IsOptional()
    @IsNumber()
    price: number;
    
    @ApiProperty({ description: 'Category ID for this item', required: false })
    @IsString()
    @IsOptional()
    categoryId?: string;
}
