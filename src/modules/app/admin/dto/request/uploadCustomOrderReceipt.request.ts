import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional, Min, Length } from 'class-validator';

export class UploadCustomOrderReceiptRequestDTO {
    @ApiProperty({ description: 'Media ID of uploaded receipt image' })
    @IsString()
    receiptImageId: string; // Changed from receiptImagePath

    @ApiProperty({ description: 'Name of the custom vendor from receipt' })
    @IsString()
    @Length(2, 100)
    vendorName: string;

    @ApiProperty({ description: 'Amount paid to custom vendor (from receipt)' })
    @IsNumber()
    @Min(1)
    amountPaid: number;

    @ApiProperty({ enum: ['CASH', 'CARD', 'BANK_TRANSFER', 'MOBILE_PAYMENT'] })
    @IsEnum(['CASH', 'CARD', 'BANK_TRANSFER', 'MOBILE_PAYMENT'])
    paymentMethod: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    notes?: string;
}
