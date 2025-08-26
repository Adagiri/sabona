import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class UpdateLocationRequestDTO {
    @ApiProperty({ description: 'Current latitude' })
    @IsNumber()
    lat: number;

    @ApiProperty({ description: 'Current longitude' })
    @IsNumber()
    long: number;
}
