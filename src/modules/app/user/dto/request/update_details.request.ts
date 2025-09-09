import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString,  } from 'class-validator';

export default class UpdateUserDetailsRequestDTO {
    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty()
    @IsOptional()
    firstName: string;

    @ApiProperty()
    @IsOptional()
    lastName: string;

    @ApiProperty()
    @IsOptional()
    @IsEmail()
    email: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    city: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    state: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    postalCode: string;
}
