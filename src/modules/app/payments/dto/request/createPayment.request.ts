import { ApiProperty } from '@nestjs/swagger';
import { PaymentTransactionType } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export default class CreatePaymentRequestDTO {
    @ApiProperty()
    @IsString()
    @IsOptional()
    orderId: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    tipTransactionId: string;

    @ApiProperty()
    @IsEnum(PaymentTransactionType)
    paymentType: PaymentTransactionType

    @ApiProperty()
    @IsString()
    transactionRef: string;

    @ApiProperty()
    @IsNumber()
    amount: number;

    @ApiProperty()
    @IsString()
    type: string;

    @ApiProperty()
    @IsString()
    status: string;

    @ApiProperty()
    @IsString()
    paymentMethod: string;
}
