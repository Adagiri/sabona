import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export default class LoginRequestDTO {
    @ApiProperty({ description: 'Email' })
    @IsEmail()
    phone: string;
}
