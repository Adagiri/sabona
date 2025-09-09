import { ApiProperty } from '@nestjs/swagger';
import { UserType } from '@prisma/client';
import {
    IsOptional,
    IsString,
} from 'class-validator';

export class SocialVerificationRequestDTO {

    @ApiProperty()
    @IsString()
    token: string;

    @ApiProperty()
    @IsString()
    firstName: string;

    @ApiProperty()
    @IsString()
    lastName: string;

    @ApiProperty()
    @IsString()
    email: string;

    @ApiProperty({ enum: UserType })
    @IsString()
    @IsOptional()
    type: UserType;

    @ApiProperty()
    @IsOptional()
    longitude: number;

    @ApiProperty()
    @IsOptional()
    latitude: number;

    @ApiProperty()
    @IsOptional()
    referrerId: string;

}
