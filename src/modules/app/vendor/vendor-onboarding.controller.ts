import { Body, Param, Query } from '@nestjs/common';
import { ApiController, Post, Get, Authorized } from '../../../core/decorators';
import VendorOnboardingService from './vendor-onboarding.service';
import {
    VendorSignupRequestDTO,
    AdminApproveVendorRequestDTO,
    AdminRejectVendorRequestDTO,
    AdminUploadVendorDocumentsRequestDTO,
    AdminSearchMainVendorsRequestDTO,
} from './dto/request/vendor-onboarding.request';
import {
    VendorSignupResponseDTO,
    PendingVendorResponseDTO,
    MainVendorSearchResultDTO,
    AdminActionResponseDTO,
    VendorDocumentsResponseDTO,
    VendorBranchesResponseDTO,
} from './dto/response/vendor-onboarding.response';
import { UserType } from '@prisma/client';

@ApiController({
    path: '/vendor',
    tag: 'vendor-onboarding',
    version: '1',
})
export default class VendorOnboardingController {
    constructor(private _vendorOnboardingService: VendorOnboardingService) {}

    // VENDOR ENDPOINTS
    @Post({
        path: '/signup',
        description: 'Vendor signup with laundry details',
        response: VendorSignupResponseDTO,
    })
    async vendorSignup(@Body() data: VendorSignupRequestDTO): Promise<VendorSignupResponseDTO> {
        return this._vendorOnboardingService.vendorSignup(data);
    }

    @Post({
        path: '/verify-otp/:vendorId/:otp',
        description: 'Verify OTP sent after admin approval',
        response: AdminActionResponseDTO,
    })
    async verifyOTP(@Param('vendorId') vendorId: string, @Param('otp') otp: string): Promise<AdminActionResponseDTO> {
        return this._vendorOnboardingService.verifyVendorOTP(vendorId, otp);
    }

    // ADMIN ENDPOINTS
    @Authorized(UserType.ADMIN)
    @Get({
        path: '/admin/pending',
        description: 'Get all pending vendor signups for admin review',
        response: [PendingVendorResponseDTO],
    })
    async getPendingVendors(): Promise<PendingVendorResponseDTO[]> {
        return this._vendorOnboardingService.getPendingVendors();
    }

    @Authorized(UserType.ADMIN)
    @Get({
        path: '/admin/main-vendors/search',
        description: 'Search existing main vendors by laundry name for branch linking',
        response: [MainVendorSearchResultDTO],
    })
    async searchMainVendors(@Query() data: AdminSearchMainVendorsRequestDTO): Promise<MainVendorSearchResultDTO[]> {
        return this._vendorOnboardingService.searchMainVendors(data);
    }

    @Authorized(UserType.ADMIN)
    @Post({
        path: '/admin/:vendorId/approve',
        description: 'Approve vendor signup and create new laundry (optionally link to main vendor)',
        response: AdminActionResponseDTO,
    })
    async approveVendor(
        @Param('vendorId') vendorId: string,
        @Body() data: AdminApproveVendorRequestDTO,
    ): Promise<AdminActionResponseDTO> {
        return this._vendorOnboardingService.approveVendor(
            vendorId,
            data,
        );
    }

    @Authorized(UserType.ADMIN)
    @Post({
        path: '/admin/:vendorId/reject',
        description: 'Reject vendor signup with reason',
        response: AdminActionResponseDTO,
    })
    async rejectVendor(
        @Param('vendorId') vendorId: string,
        @Body() data: Omit<AdminRejectVendorRequestDTO, 'vendorId'>,
    ): Promise<AdminActionResponseDTO> {
        return this._vendorOnboardingService.rejectVendor({
            vendorId,
            ...data,
        });
    }

    @Authorized(UserType.ADMIN)
    @Post({
        path: '/admin/:vendorId/documents',
        description: 'Upload VAT and business certificate documents for approved vendor',
        response: AdminActionResponseDTO,
    })
    async uploadVendorDocuments(
        @Param('vendorId') vendorId: string,
        @Body() data: AdminUploadVendorDocumentsRequestDTO,
    ): Promise<AdminActionResponseDTO> {
        return this._vendorOnboardingService.uploadVendorDocuments(vendorId, data);
    }

    @Authorized(UserType.ADMIN)
    @Get({
        path: '/admin/:vendorId/documents',
        description: 'Get vendor documents for review',
        response: VendorDocumentsResponseDTO,
    })
    async getVendorDocuments(@Param('vendorId') vendorId: string): Promise<VendorDocumentsResponseDTO> {
        return this._vendorOnboardingService.getVendorDocuments(vendorId);
    }

    @Authorized(UserType.ADMIN)
    @Get({
        path: '/admin/:mainVendorId/branches',
        description: 'Get all branches of a main vendor',
        response: VendorBranchesResponseDTO,
    })
    async getVendorBranches(@Param('mainVendorId') mainVendorId: string): Promise<VendorBranchesResponseDTO> {
        return this._vendorOnboardingService.getVendorBranches(mainVendorId);
    }
}
