import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, IsInt } from 'class-validator';

export class LaundryServiceDTO {
    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ description: 'Media ID for SVG icon', required: false })
    @IsInt()
    @IsOptional()
    iconId?: number;
}

export default class CreateLaundryRequestDTO {
    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty()
    @IsString()
    address: string;

    @ApiProperty({ type: [LaundryServiceDTO], required: false })
    @Type(() => LaundryServiceDTO)
    @IsOptional()
    services?: LaundryServiceDTO[];
}
