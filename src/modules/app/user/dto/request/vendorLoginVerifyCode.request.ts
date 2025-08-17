import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class VendorLoginVerifyCodeRequestDTO {
    @ApiProperty({ description: 'Vendor phone number' })
    @IsString()
    @IsNotEmpty()
    @Matches(/^(?:00|\+)(92|966|20)[0-9\s.\/-]{8,12}$/, {
        message: 'Phone number must start with +92 or +966 followed by the correct format',
    })
    phone: string;

    @ApiProperty({ description: 'OTP code received via SMS' })
    @IsString()
    @IsNotEmpty()
    otp: string;
}
