import { ApiProperty } from '@nestjs/swagger';

export class VendorLoginVerifyCodeResponseDTO {
    @ApiProperty({ description: 'JWT authentication token' })
    token: string;

    @ApiProperty({ description: 'Vendor user data' })
    user: {
        id: string;
        phone: string;
        type: string;
        status: string;
        firstName?: string;
        lastName?: string;
    };
}
