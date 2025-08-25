export class UploadRiderDocumentResponseDTO {
    success: boolean;
    message: string;
    riderId: string;
}

export class FinalizeRiderDocumentResponseDTO {
    success: boolean;
    message: string;
    document: {
        id: number;
        type: string;
        status: string;
        path: string;
    };
}

export class RiderDocumentDTO {
    id: number;
    name: string;
    status: string;
    uploadedAt: Date;
    viewUrl: string | null;
}

export class RiderDocumentsResponseDTO {
    driverLicense: RiderDocumentDTO | null;
    hasAllDocuments: boolean;
    totalDocuments: number;
}
