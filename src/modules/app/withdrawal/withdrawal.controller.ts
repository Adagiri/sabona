import { Body, Param, Query, Res, StreamableFile } from '@nestjs/common';
import { Response } from 'express';
import WithdrawalService from './withdrawal.service';
import { UserType } from '@prisma/client';
import { Authorized, ApiController, Get, Post } from '../../../core/decorators';
import {
    InitiateWithdrawalResponseDTO,
    CompleteWithdrawalResponseDTO,
    UploadInvoiceResponseDTO,
    UploadLaundryInvoiceRequestDTO,
    GetWithdrawalQueryDTO,
    WithdrawalDTO,
} from './dto/withdrawal.dto';

@ApiController({
    path: '/admin/withdrawals',
    tag: 'Withdrawal Management',
    version: '1',
})
export class WithdrawalController {
    constructor(private readonly withdrawalService: WithdrawalService) {}

    /**
     * Initiate new withdrawal
     */
    @Authorized(UserType.ADMIN)
    @Post({
        path: '/initiate',
        description: 'Initiate a new withdrawal cycle',
        response: InitiateWithdrawalResponseDTO,
    })
    async initiateWithdrawal(): Promise<InitiateWithdrawalResponseDTO> {
        const withdrawal = await this.withdrawalService.initiateWithdrawal();
        return {
            message: 'Withdrawal initiated successfully',
            withdrawal,
        };
    }

    /**
     * Get all withdrawals (optionally filtered)
     */
    @Authorized(UserType.ADMIN)
    @Get({
        path: '/',
        description: 'Get all withdrawals',
        response: [WithdrawalDTO],
    })
    async getWithdrawals(@Query() query: GetWithdrawalQueryDTO): Promise<WithdrawalDTO[]> {
        return this.withdrawalService.getWithdrawals(query.status);
    }

    /**
     * Get Pre-Withdrawals (pending status)
     */
    @Authorized(UserType.ADMIN)
    @Get({
        path: '/pre-withdrawals',
        description: 'Get all pre-withdrawals (pending)',
        response: [WithdrawalDTO],
    })
    async getPreWithdrawals(): Promise<WithdrawalDTO[]> {
        return this.withdrawalService.getWithdrawals('PENDING');
    }

    /**
     * Get Completed Withdrawals
     */
    @Authorized(UserType.ADMIN)
    @Get({
        path: '/completed',
        description: 'Get all completed withdrawals',
        response: [WithdrawalDTO],
    })
    async getCompletedWithdrawals(): Promise<WithdrawalDTO[]> {
        return this.withdrawalService.getWithdrawals('COMPLETED');
    }

    /**
     * Get single withdrawal by ID
     */
    @Authorized(UserType.ADMIN)
    @Get({
        path: '/:id',
        description: 'Get withdrawal details by ID',
        response: WithdrawalDTO,
    })
    async getWithdrawalById(@Param('id') id: string): Promise<WithdrawalDTO> {
        return this.withdrawalService.getWithdrawalById(id);
    }

    /**
     * Upload laundry invoice (expects mediaId from media upload flow)
     */
    @Authorized(UserType.ADMIN)
    @Post({
        path: '/upload-invoice',
        description: 'Upload invoice for a laundry in a withdrawal',
        response: UploadInvoiceResponseDTO,
    })
    async uploadLaundryInvoice(@Body() body: UploadLaundryInvoiceRequestDTO): Promise<UploadInvoiceResponseDTO> {
        return this.withdrawalService.uploadLaundryInvoice(body.withdrawalLaundryId, body.invoiceMediaId);
    }

    /**
     * Complete withdrawal
     */
    @Authorized(UserType.ADMIN)
    @Post({
        path: '/:id/complete',
        description: 'Complete a withdrawal (all invoices uploaded)',
        response: CompleteWithdrawalResponseDTO,
    })
    async completeWithdrawal(@Param('id') id: string): Promise<CompleteWithdrawalResponseDTO> {
        return this.withdrawalService.completeWithdrawal(id);
    }

    /**
     * Generate and store laundry earning report on S3
     */
    @Authorized(UserType.ADMIN)
    @Post({
        path: '/:id/laundry/:laundryId/generate-report',
        description: 'Generate and store laundry earning report on S3',
        response: Object,
    })
    async generateAndStoreReport(@Param('id') withdrawalId: string, @Param('laundryId') laundryId: string) {
        return this.withdrawalService.generateAndStoreReport(withdrawalId, laundryId);
    }

    /**
     * Cancel withdrawal
     */
    @Authorized(UserType.ADMIN)
    @Post({
        path: '/:id/cancel',
        description: 'Cancel a pending withdrawal',
        response: CompleteWithdrawalResponseDTO,
    })
    async cancelWithdrawal(@Param('id') id: string): Promise<CompleteWithdrawalResponseDTO> {
        return this.withdrawalService.cancelWithdrawal(id);
    }

    /**
     * Download laundry earning report (from S3 or generate on-demand)
     */
    @Authorized(UserType.ADMIN)
    @Get({
        path: '/:id/laundry/:laundryId/report',
        description: 'Download laundry earning report (Excel)',
        response: StreamableFile,
    })
    async downloadLaundryReport(
        @Param('id') withdrawalId: string,
        @Param('laundryId') laundryId: string,
        @Res({ passthrough: true }) res: Response,
    ): Promise<StreamableFile> {
        const result = await this.withdrawalService.getOrGenerateReport(withdrawalId, laundryId);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=laundry-earnings-${laundryId}.xlsx`);

        return new StreamableFile(result.buffer);
    }

    /**
     * Get invoice for withdrawal laundry
     */
    @Authorized(UserType.ADMIN)
    @Get({
        path: '/laundry/:withdrawalLaundryId/invoice',
        description: 'Get invoice for withdrawal laundry',
        response: Object,
    })
    async getWithdrawalLaundryInvoice(
        @Param('withdrawalLaundryId') withdrawalLaundryId: string,
    ): Promise<{ mediaId: number; url: string }> {
        return this.withdrawalService.getWithdrawalLaundryInvoice(withdrawalLaundryId);
    }
}
