import { ApiProperty } from '@nestjs/swagger';

class IconMedia {
    @ApiProperty()
    id: number;

    @ApiProperty()
    name: string;

    @ApiProperty()
    path: string;

    @ApiProperty()
    extension: string;
}

export class LaundryItemCategoryResponseDTO {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    description?: string;

    @ApiProperty({ type: IconMedia, required: false })
    icon?: IconMedia;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;
}

export class GetAllLaundryItemCategoriesResponseDTO {
    @ApiProperty({ type: [LaundryItemCategoryResponseDTO] })
    data: LaundryItemCategoryResponseDTO[];
}

export class LaundryItemCategoryMessageResponseDTO {
    @ApiProperty()
    message: string;
}
