import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt } from 'class-validator';

export class EditLaundryItemCategoryRequestDTO {
    @ApiProperty({ description: 'Category name', required: false })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty({ description: 'Category description', required: false })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ description: 'Media ID for SVG icon', required: false })
    @IsInt()
    @IsOptional()
    iconId?: number;
}
