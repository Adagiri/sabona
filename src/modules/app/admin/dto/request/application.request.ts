import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsEnum, IsNumber, Min, Max, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import PaginatedRequest from '../../../../../core/request/paginated.request';
import { LaundryAddressTranslationDTO } from 'src/modules/app/vendor/dto/request/createLaundry.request';

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
    mainVendorId: string;

    @ApiProperty({ required: true })
    @IsOptional()
    @IsString()
    contactPhone: string;

    @ApiProperty({ type: LaundryAddressTranslationDTO, required: true })
    @ValidateNested()
    @Type(() => LaundryAddressTranslationDTO)
    addressLocale: LaundryAddressTranslationDTO;
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
