import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class ReorderLaundryServiceItemsRequestDTO {
    @ApiProperty({
        description: 'Array of item IDs in the desired order (within the specific service + category)',
        type: [String],
        example: ['uuid1', 'uuid2', 'uuid3'],
    })
    @IsArray()
    @IsString({ each: true })
    itemIds: string[];
}
