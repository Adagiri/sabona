import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty } from 'class-validator';

export class UpdateLocationRequestDTO {
    @ApiProperty({ description: 'Latitude coordinate' })
    @IsNumber()
    @IsNotEmpty()
    lat: number;

    @ApiProperty({ description: 'Longitude coordinate' })
    @IsNumber()
    @IsNotEmpty()
    long: number;
}
