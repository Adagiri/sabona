import { ApiProperty } from '@nestjs/swagger';

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

export class ApplicationDocumentsResponseDTO {
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
    subVendors: VendorBranchInfoDTO[];

    @ApiProperty()
    totalSubVendors: number;
}
