import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class VendorSignupRequestDTO {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    laundryName: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    phone: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    latitude: number;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    longitude: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    referrerId: string;
}
