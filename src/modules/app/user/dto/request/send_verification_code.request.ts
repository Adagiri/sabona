import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

export default class SendVerificationCodeRequestDTO {
    @ApiProperty()
    @Matches(/^(?:00|\\+)[0-9\\s.\\/-]{6,20}$/, {
        message: 'phone must start with 00 followed by the country code',
    })
    phone: string;

}
