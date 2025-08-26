import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional } from 'class-validator';

export class PayTabsCallbackRequestDTO {
    @ApiProperty()
    @IsString()
    orderId: string;

    @ApiProperty()
    @IsString()
    transactionRef: string;

    @ApiProperty({ description: 'Payment status: A=Success, D=Declined, etc.' })
    @IsString()
    status: string;

    @ApiProperty()
    @IsNumber()
    amount: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    responseCode?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    responseMessage?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    authorizationCode?: string;
}

export class PayTabsCallbackResponseDTO {
    @ApiProperty()
    success: boolean;

    @ApiProperty()
    message: string;
}
