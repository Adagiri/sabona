import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SearchMainVendorsRequestDTO {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    laundryName: string;
}

export class AdminSearchMainVendorsRequestDTO {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    laundryName: string;
}
