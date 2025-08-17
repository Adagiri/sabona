import { ApiProperty } from '@nestjs/swagger';

export class VendorLoginSendCodeResponseDTO {
    @ApiProperty()
    message: string;
}
