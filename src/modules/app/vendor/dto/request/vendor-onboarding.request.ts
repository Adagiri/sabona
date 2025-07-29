import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class VendorSignupRequestDTO {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    laundryName: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    phone: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    latitude: number;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    longitude: number;
}

export class AdminApproveVendorRequestDTO {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    vendorId: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    mainVendorId?: string; // ID of existing main vendor to link this vendor as a branch

    @ApiProperty()
    @IsOptional()
    @IsString()
    address: string; // Confirmed address in string format

    @ApiProperty()
    @IsOptional()
    @IsString()
    contactPhone: string; // Customer care phone number
}

export class AdminRejectVendorRequestDTO {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    vendorId: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    rejectionReason: string;
}

export class AdminUploadVendorDocumentsRequestDTO {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    vendorId: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    vatNumberDocId: string; // Media ID for VAT document

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    businessCertDocId: string; // Media ID for business certificate
}

export class AdminSearchMainVendorsRequestDTO {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    laundryName: string;
}
