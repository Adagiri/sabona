import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';
import PaginatedRequest from '../../../../../core/request/paginated.request';

export enum ApplicantType {
    VENDOR = 'VENDOR',
    RIDER = 'RIDER',
}

export default class FindApplicationRequestDTO extends PaginatedRequest {
    @ApiPropertyOptional({ enum: ApplicantType })
    @IsEnum(ApplicantType)
    type: ApplicantType;
}

export class ApproveApplicationRequestDTO {
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

export class RejectApplicationRequestDTO {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    rejectionReason: string;
}

export class UploadApplicationDocumentsRequestDTO {
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
