import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class AssignDriverToCustomOrderRequestDTO {
    @ApiProperty({ description: 'Driver ID to assign to the custom order' })
    @IsString()
    @IsUUID()
    riderId: string;
}
