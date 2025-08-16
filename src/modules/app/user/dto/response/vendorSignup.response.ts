import { ApiProperty } from '@nestjs/swagger';

export class VendorSignupResponseDTO {
    @ApiProperty()
    id: string;

    @ApiProperty()
    phone: string;

    @ApiProperty()
    message: string;
}
