import { IsString, IsOptional, ValidateNested } from 'class-validator';
import { IconDTO } from '../../../icon/dto/response/icon.response';
import { Type } from 'class-transformer';

export class LaundryItemCategoryDTO {
    @IsString()
    id: string;

    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => IconDTO)
    icon?: IconDTO;

    @IsString()
    createdAt: Date;

    @IsString()
    updatedAt: Date;

    @IsOptional()
    _count?: {
        laundryServiceItems: number;
    };
}

export class LaundryItemCategoryResponseDTO {
    @IsString()
    id: string;

    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => IconDTO)
    icon?: IconDTO;

    @IsString()
    createdAt: Date;

    @IsString()
    updatedAt: Date;

    @IsOptional()
    _count?: {
        laundryServiceItem: number;
    };
}

export class GetAllLaundryItemCategoriesResponseDTO {
    @ValidateNested({ each: true })
    @Type(() => LaundryItemCategoryDTO)
    data: LaundryItemCategoryDTO[];
}

export class LaundryItemCategoryMessageResponseDTO {
    @IsString()
    message: string;
}
