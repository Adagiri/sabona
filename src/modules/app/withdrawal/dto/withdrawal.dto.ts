// ============================================================================
// FILE: src/modules/app/withdrawal/dto/withdrawal.dto.ts
// ============================================================================

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { WithdrawalStatus } from '@prisma/client';

// ============================================================================
// REQUEST DTOs
// ============================================================================

export class InitiateWithdrawalRequestDTO {
    // No body needed - just triggers withdrawal creation
}

export class UploadLaundryInvoiceRequestDTO {
    @ApiProperty({ description: 'Withdrawal laundry ID' })
    @IsUUID()
    withdrawalLaundryId: string;

    @ApiProperty({ description: 'Invoice file URL (after upload to storage)' })
    @IsString()
    invoiceUrl: string;
}

export class GetWithdrawalQueryDTO {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    status?: WithdrawalStatus;
}

// ============================================================================
// RESPONSE DTOs
// ============================================================================

export class LaundryEarningDetailDTO {
    @ApiProperty()
    orderNumber: number;

    @ApiProperty()
    orderDate: Date;

    @ApiProperty()
    orderAmount: number; // Total amount paid by customer

    @ApiProperty()
    serviceCharge: number; // Platform markup

    @ApiProperty()
    deliveryCharge: number;

    @ApiProperty()
    vendorEarning: number; // What vendor receives

    @ApiProperty()
    serviceChargeAmount: number; // Service charge for this order

    @ApiProperty()
    transferCharge: number; // Transfer fee
}

export class WithdrawalLaundryDTO {
    @ApiProperty()
    id: string;

    @ApiProperty()
    laundryName: string;

    @ApiProperty()
    branchType: string; // "Main" or "Sub"

    @ApiProperty()
    totalOrders: number;

    @ApiProperty()
    totalEarnings: number;

    @ApiProperty({ required: false })
    invoiceUrl?: string;

    @ApiProperty({ required: false })
    invoiceUploadedAt?: Date;

    @ApiProperty()
    hasInvoice: boolean;
}

export class WithdrawalDTO {
    @ApiProperty()
    id: string;

    @ApiProperty()
    withdrawalNumber: number;

    @ApiProperty()
    status: WithdrawalStatus;

    @ApiProperty()
    startDate: Date;

    @ApiProperty()
    endDate: Date;

    @ApiProperty({ required: false })
    completedAt?: Date;

    @ApiProperty()
    laundryCount: number;

    @ApiProperty()
    totalAmount: number;

    @ApiProperty({ required: false })
    uploadedInvoices?: number;

    @ApiProperty({ type: [WithdrawalLaundryDTO], required: false })
    laundries?: WithdrawalLaundryDTO[];
}

export class InitiateWithdrawalResponseDTO {
    @ApiProperty()
    message: string;

    @ApiProperty()
    withdrawal: WithdrawalDTO;
}

export class CompleteWithdrawalResponseDTO {
    @ApiProperty()
    message: string;

    @ApiProperty()
    withdrawalId: string;
}

export class UploadInvoiceResponseDTO {
    @ApiProperty()
    message: string;

    @ApiProperty()
    withdrawalLaundryId: string;
}
