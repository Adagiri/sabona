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
    @IsOptional()
    @IsString()
    mainVendorId?: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    address: string;

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
    vatNumberDocId: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    businessCertDocId: string;
}

export class AdminSearchMainVendorsRequestDTO {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    laundryName: string;
}
