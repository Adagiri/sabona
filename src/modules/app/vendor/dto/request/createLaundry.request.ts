import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, IsNumber } from 'class-validator';

export class LaundryServiceDTO {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsNumber()
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
