import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Max, Min } from 'class-validator';

export class ValidateCustomLocationRequestDTO {
    @ApiProperty({ description: 'Latitude to validate' })
    @IsNumber()
    @Min(-90)
    @Max(90)
    lat: number;

    @ApiProperty({ description: 'Longitude to validate' })
    @IsNumber()
    @Min(-180)
    @Max(180)
    long: number;
}
