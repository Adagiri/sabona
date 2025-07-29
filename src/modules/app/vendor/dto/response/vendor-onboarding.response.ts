import { ApiProperty } from '@nestjs/swagger';
import { VendorStatus } from '@prisma/client';

export class VendorSignupResponseDTO {
    @ApiProperty()
    id: string;

    @ApiProperty()
    phone: string;

    @ApiProperty()
    laundryName: string;

    @ApiProperty()
    status: VendorStatus;

    @ApiProperty()
    message: string;
}

export class PendingVendorResponseDTO {
    @ApiProperty()
    id: string;

    @ApiProperty()
    phone: string;

    @ApiProperty()
    laundryName: string;

    @ApiProperty()
    latitude: number;

    @ApiProperty()
    longitude: number;

    @ApiProperty()
    status: VendorStatus;

    @ApiProperty()
    createdAt: Date;
}

export class MainVendorSearchResultDTO {
    @ApiProperty()
    id: string;

    @ApiProperty()
    phone: string;

    @ApiProperty()
    laundryName: string;

    @ApiProperty()
    branchCount: number; // Number of branch vendors under this main vendor

    @ApiProperty()
    createdAt: Date;
}

export class AdminActionResponseDTO {
    @ApiProperty()
    success: boolean;

    @ApiProperty()
    message: string;

    @ApiProperty()
    vendorId: string;

    @ApiProperty()
    laundryId?: string; // Returned when laundry is created
}

export class VendorDocumentsResponseDTO {
    @ApiProperty({ required: false })
    vatNumberDoc?: {
        id: number;
        name: string;
        path: string;
        type: string;
        createdAt: Date;
    };

    @ApiProperty({ required: false })
    businessCertDoc?: {
        id: number;
        name: string;
        path: string;
        type: string;
        createdAt: Date;
    };
}

export class VendorBranchInfoDTO {
    @ApiProperty()
    id: string;

    @ApiProperty()
    phone: string;

    @ApiProperty()
    laundryName: string;

    @ApiProperty()
    status: string;

    @ApiProperty({ required: false })
    laundryId?: string;

    @ApiProperty()
    createdAt: Date;
}

export class MainVendorInfoDTO {
    @ApiProperty()
    id: string;

    @ApiProperty()
    phone: string;

    @ApiProperty()
    laundryName: string;

    @ApiProperty()
    status: string;
}

export class VendorBranchesResponseDTO {
    @ApiProperty({ type: MainVendorInfoDTO })
    mainVendor: MainVendorInfoDTO;

    @ApiProperty({ type: [VendorBranchInfoDTO] })
    branches: VendorBranchInfoDTO[];

    @ApiProperty()
    totalBranches: number;
}
