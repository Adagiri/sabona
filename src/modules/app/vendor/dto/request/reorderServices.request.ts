import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class ReorderLaundryServicesRequestDTO {
    @ApiProperty({
        description: 'Array of service IDs in the desired order',
        type: [String],
        example: ['uuid1', 'uuid2', 'uuid3'],
    })
    @IsArray()
    @IsString({ each: true })
    serviceIds: string[];
}
