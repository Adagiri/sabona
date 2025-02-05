import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Matches } from 'class-validator';

export default class UpdateUserDetailsRequestDTO {
    @ApiProperty()
    @IsOptional()
    firstName: string

    @ApiProperty()
    @IsOptional()
    lastName: string

    @ApiProperty()
    @IsOptional()
    @IsEmail()
    email: string

    @ApiProperty()
    @IsString()
    @IsOptional()
    @Matches(/^(?:00|\+)(92|966)[0-9\s.\/-]{8,12}$/, {
        message: 'Phone number must start with +92 or +966 followed by the correct format',
    })
    phone: string;

    @ApiProperty()
    @IsString()
    city: string;

    @ApiProperty()
    @IsString()
    state: string;

    @ApiProperty()
    @IsString()
    postalCode: string;
}
