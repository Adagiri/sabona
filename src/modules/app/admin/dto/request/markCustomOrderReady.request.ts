import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional } from 'class-validator';

export class MarkCustomOrderReadyRequestDTO {
    @ApiProperty({ required: false, description: 'Optional: Assign specific driver for delivery phase' })
    @IsOptional()
    @IsString()
    @IsUUID()
    deliveryRiderId?: string;
}
