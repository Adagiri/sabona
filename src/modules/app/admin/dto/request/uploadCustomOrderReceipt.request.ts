import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, Min, Length } from 'class-validator';

export class UploadCustomOrderReceiptRequestDTO {
    @ApiProperty({ description: 'Path to uploaded receipt image' })
    @IsString()
    receiptImagePath: string;

    @ApiProperty({ description: 'Name of the custom vendor from receipt' })
    @IsString()
    @Length(2, 100)
    vendorName: string;

    @ApiProperty({ description: 'Amount paid to custom vendor (from receipt)' })
    @IsNumber()
    @Min(1, { message: 'Amount must be greater than 0' })
    amountPaid: number;

    @ApiProperty({ enum: ['CASH', 'CARD'], description: 'Payment method used by driver' })
    @IsEnum(['CASH', 'CARD'])
    paymentMethod: 'CASH' | 'CARD';
}
