import { ApiProperty } from '@nestjs/swagger';
import { UserType } from '@prisma/client';
import {
    IsOptional,
    IsString,
    Matches,
} from 'class-validator';

export class SignupRequestDTO {
    @ApiProperty()
    // @IsPhoneNumber('AE')
    @Matches(/^(?:00|\\+)[0-9\\s.\\/-]{6,20}$/, {
        message: 'phone must start with 00 followed by the country code',
    })
    phone: string

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
}
