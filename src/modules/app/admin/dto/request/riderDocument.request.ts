import { IsString, IsNotEmpty } from 'class-validator';

export class UploadRiderDocumentRequestDTO {
    @IsString()
    @IsNotEmpty()
    driverLicenseDocId: string;
}

export class FinalizeRiderDocumentRequestDTO {
    @IsString()
    @IsNotEmpty()
    documentType: string;

    @IsString()
    @IsNotEmpty()
    uploadId: string;
}
