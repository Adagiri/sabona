import { ApiProperty } from '@nestjs/swagger';
import {IsNotEmpty, IsString, Matches } from 'class-validator';

export default class IsUserWithEmailExistRequestDTO {
    @ApiProperty()
    @IsString()
    email: string;

}
