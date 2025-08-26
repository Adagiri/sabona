import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateLaundryItemCategoryRequestDTO {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsNumber()
    iconId?: number;
}
