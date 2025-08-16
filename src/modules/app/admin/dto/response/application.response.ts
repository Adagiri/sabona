import { ApiProperty } from '@nestjs/swagger';

export class ApplicationRejectMessageResponseDTO {
    @ApiProperty()
    message: string;
}

export class UploadApplicationDocumentsResponseDTO {
    @ApiProperty()
    success: boolean;

    @ApiProperty()
    message: string;

    @ApiProperty()
    vendorId: string;
}
