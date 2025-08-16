import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MediaType } from '@prisma/client';
import { IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsString, Length } from 'class-validator';

export class UploadInitiateMediaRequestDTO {
    @ApiProperty()
    @Length(1, 255)
    name: string;

    @ApiProperty({ description: 'Size in KB' })
    @IsNumber()
    size: number;

    @ApiProperty({ enum: MediaType })
    @IsEnum(MediaType)
    type: MediaType;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    public?: boolean;
}

export class UploadInitiateAdminMediaRequestDTO {
    @ApiProperty()
    @Length(1, 255)
    name: string;

    @ApiProperty({ description: 'Size in KB' })
    @IsNumber()
    size: number;

    @ApiProperty({ enum: MediaType })
    @IsEnum(MediaType)
    type: MediaType;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    public?: boolean;

    @ApiProperty()
    @IsString()
    userId: string;
}

export class UploadFinalizeMediaRequestDTO {
    @ApiProperty()
    @IsInt()
    id: number;
}
export class UploadFinalizeAdminMediaRequestDTO {
    @ApiProperty()
    @IsInt()
    id: number;

    @ApiProperty()
    @IsString()
    userId: string;
}
