import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional } from 'class-validator';

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
}
