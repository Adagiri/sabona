import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
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
    @ApiProperty({ required: true })
    @IsNotEmpty()
    @IsString()
    mainVendorId: string;

    @ApiProperty({ required: true })
    @IsNotEmpty()
    @IsString()
    address: string;

    @ApiProperty({ required: true })
    @IsNotEmpty()
    @IsString()
    contactPhone: string;
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

    @ApiPropertyOptional({
        description: 'Maximum number of results to return',
        default: 20,
        minimum: 1,
        maximum: 50,
    })
    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    @Min(1)
    @Max(50)
    limit?: number = 20;
}
