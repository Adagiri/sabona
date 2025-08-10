import { Injectable } from '@nestjs/common';
import { VendorStatus, TokenReason } from '@prisma/client';
import DatabaseService from '../../../database/database.service';
import { BadRequestException, NotFoundException } from '../../../core/exceptions/response.exception';
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
} from './dto/response/vendor-onboarding.response';
import AppConfig from 'src/configs/app.config';
import { APP_ENV } from 'src/constants';
import SMSService from 'src/modules/sms/sms.service';

@Injectable()
export default class VendorOnboardingService {
    constructor(
        private _dbService: DatabaseService,
        private _smsService: SMSService,
    ) {}

    // VENDOR SIGNUP FLOW
    async vendorSignup(data: VendorSignupRequestDTO): Promise<VendorSignupResponseDTO> {
        // Check if phone number already exists
        const existingVendor = await this._dbService.vendor.findFirst({
            where: { phone: data.phone, status: VendorStatus.APPROVED },
        });

        if (existingVendor) {
            throw new BadRequestException('Phone number already registered');
        }

        // Create vendor with pending status
        const vendor = await this._dbService.vendor.create({
            data: {
                phone: data.phone,
                laundryName: data.laundryName,
                latitude: data.latitude,
                longitude: data.longitude,
                status: VendorStatus.PENDING,
                isDocumentsUploaded: false,
            },
        });

        return {
            id: vendor.id,
            phone: vendor.phone,
            laundryName: vendor.laundryName,
            status: vendor.status,
            message: 'Signup successful. Your account is pending admin approval.',
        };
    }

    // ADMIN: GET PENDING VENDORS
    async getPendingVendors(): Promise<PendingVendorResponseDTO[]> {
        const pendingVendors = await this._dbService.vendor.findMany({
            where: {
                status: VendorStatus.PENDING,
                deletedAt: null,
            },
            orderBy: { createdAt: 'asc' },
        });

        return pendingVendors.map((vendor) => ({
            id: vendor.id,
            phone: vendor.phone,
            laundryName: vendor.laundryName,
            latitude: vendor.latitude,
            longitude: vendor.longitude,
            status: vendor.status,
            createdAt: vendor.createdAt,
        }));
    }

    // ADMIN: SEARCH EXISTING MAIN VENDORS BY LAUNDRY NAME
    async searchMainVendors(data: AdminSearchMainVendorsRequestDTO): Promise<MainVendorSearchResultDTO[]> {
        const mainVendors = await this._dbService.vendor.findMany({
            where: {
                laundryName: {
                    contains: data.laundryName,
                    mode: 'insensitive',
                },
                mainVendorId: null, // Only main vendors (not branches)
                status: VendorStatus.APPROVED, // Only approved main vendors
                deletedAt: null,
            },
            include: {
                _count: {
                    select: {
                        branches: true, // Count branch vendors under this main vendor
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return mainVendors.map((vendor) => ({
            id: vendor.id,
            phone: vendor.phone,
            laundryName: vendor.laundryName,
            branchCount: vendor._count.branches,
            createdAt: vendor.createdAt,
        }));
    }

    // ADMIN: APPROVE VENDOR
    async approveVendor(vendorId: string, data: AdminApproveVendorRequestDTO): Promise<AdminActionResponseDTO> {
        const vendor = await this._dbService.vendor.findUnique({
            where: { id: vendorId },
        });

        if (!vendor) {
            throw new NotFoundException('Vendor not found');
        }

        if (vendor.status !== VendorStatus.PENDING) {
            throw new BadRequestException('Vendor is not in pending status');
        }

        // If mainVendorId is provided, validate it exists and is a main vendor
        if (data.mainVendorId) {
            const mainVendor = await this._dbService.vendor.findUnique({
                where: { id: data.mainVendorId },
            });

            if (!mainVendor) {
                throw new NotFoundException('Main vendor not found');
            }

            if (mainVendor.mainVendorId !== null) {
                throw new BadRequestException('Specified vendor is not a main vendor');
            }

            if (mainVendor.status !== VendorStatus.APPROVED) {
                throw new BadRequestException('Main vendor must be approved');
            }
        }

        const newLaundry = await this._dbService.laundry.create({
            data: {
                name: vendor.laundryName,
                address: data.address,
                vendorId: vendor.id,
            },
        });

        await this._dbService.vendor.update({
            where: { id: vendor.id },
            data: {
                status: VendorStatus.APPROVED,
                address: data.address,
                contactPhone: data.contactPhone,
                mainVendorId: data.mainVendorId || null, // Link to main vendor if provided
            },
        });

        if (AppConfig.APP.ENV !== APP_ENV.TEST) {
            const otp = await this._smsService.sendVerificationCode(data.contactPhone);
            if (!otp) {
                throw new BadRequestException('Error while sending verification code, Please try again!!!');
            }
        }

        return {
            success: true,
            message: data.mainVendorId
                ? 'Vendor approved as branch successfully. OTP sent to vendor.'
                : 'Vendor approved as main vendor successfully. OTP sent to vendor.',
            vendorId: vendor.id,
            laundryId: newLaundry.id,
        };
    }

    // ADMIN: REJECT VENDOR
    async rejectVendor(data: AdminRejectVendorRequestDTO): Promise<AdminActionResponseDTO> {
        const vendor = await this._dbService.vendor.findUnique({
            where: { id: data.vendorId },
        });

        if (!vendor) {
            throw new NotFoundException('Vendor not found');
        }

        if (vendor.status !== VendorStatus.PENDING) {
            throw new BadRequestException('Vendor is not in pending status');
        }

        await this._dbService.vendor.update({
            where: { id: vendor.id },
            data: {
                status: VendorStatus.REJECTED,
                rejectionReason: data.rejectionReason,
            },
        });

        return {
            success: true,
            message: 'Vendor rejected successfully',
            vendorId: vendor.id,
        };
    }

    // ADMIN: UPLOAD VENDOR DOCUMENTS
    async uploadVendorDocuments(
        vendorId: string,
        data: AdminUploadVendorDocumentsRequestDTO,
    ): Promise<AdminActionResponseDTO> {
        const vendor = await this._dbService.vendor.findUnique({
            where: { id: vendorId },
        });

        if (!vendor) {
            throw new NotFoundException('Vendor not found');
        }

        if (vendor.status !== VendorStatus.APPROVED) {
            throw new BadRequestException('Vendor must be approved before uploading documents');
        }

        // Verify both documents exist
        const vatDoc = await this._dbService.media.findUnique({
            where: { id: parseInt(data.vatNumberDocId) },
        });

        const businessDoc = await this._dbService.media.findUnique({
            where: { id: parseInt(data.businessCertDocId) },
        });

        if (!vatDoc || !businessDoc) {
            throw new NotFoundException('One or both documents not found');
        }

        const vatDocMeta = {
            docType: 'VAT_NUMBER_DOC',
            uploadedFor: 'vendor-verification',
            uploadedBy: 'admin',
        };
        if (vatDoc.meta) {
            Object.assign(vatDocMeta, vatDoc.meta);
        }
        // Update media records to link to vendor and set document type
        await this._dbService.media.update({
            where: { id: vatDoc.id },
            data: {
                vendorId: vendor.id,
                meta: vatDocMeta,
            },
        });

        const businessDocMeta = {
            docType: 'BUSINESS_CERT_DOC',
            uploadedFor: 'vendor-verification',
            uploadedBy: 'admin',
        };
        if (businessDoc.meta) {
            Object.assign(businessDocMeta, businessDoc.meta);
        }
        await this._dbService.media.update({
            where: { id: businessDoc.id },
            data: {
                vendorId: vendor.id,
                meta: businessDocMeta,
            },
        });

        // Mark vendor as having documents uploaded
        await this._dbService.vendor.update({
            where: { id: vendor.id },
            data: {
                isDocumentsUploaded: true,
            },
        });

        return {
            success: true,
            message: 'Vendor documents uploaded successfully',
            vendorId: vendor.id,
        };
    }

    // GET VENDOR DOCUMENTS (for admin review)
    async getVendorDocuments(vendorId: string) {
        const documents = await this._dbService.media.findMany({
            where: {
                vendorId,
                meta: {
                    path: ['uploadedFor'],
                    equals: 'vendor-verification',
                },
            },
        });

        function hasDocType(meta: any): meta is { docType: string } {
            return meta && typeof meta === 'object' && typeof meta.docType === 'string';
        }

        return {
            vatNumberDoc: documents.find((doc) => hasDocType(doc.meta) && doc.meta.docType === 'VAT_NUMBER_DOC'),
            businessCertDoc: documents.find((doc) => hasDocType(doc.meta) && doc.meta.docType === 'BUSINESS_CERT_DOC'),
        };
    }

    // VERIFY OTP AND COMPLETE VENDOR ONBOARDING
    async verifyVendorOTP(vendorId: string, otp: string): Promise<AdminActionResponseDTO> {
        const tokenRecord = await this._dbService.token.findFirst({
            where: {
                vendorId,
                code: otp,
                reason: TokenReason.VERIFICATION,
                deletedAt: null,
            },
            orderBy: { createdAt: 'desc' },
        });

        if (!tokenRecord) {
            throw new BadRequestException('Invalid or expired OTP');
        }

        // Check if OTP is not older than 10 minutes
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        if (tokenRecord.createdAt < tenMinutesAgo) {
            throw new BadRequestException('OTP has expired');
        }

        // Mark token as used
        await this._dbService.token.update({
            where: { id: tokenRecord.id },
            data: { deletedAt: new Date() },
        });

        return {
            success: true,
            message: 'OTP verified successfully. Vendor can now access the app.',
            vendorId,
        };
    }

    // GET ALL BRANCHES OF A MAIN VENDOR (useful for business management)
    async getVendorBranches(mainVendorId: string) {
        const mainVendor = await this._dbService.vendor.findUnique({
            where: { id: mainVendorId },
            include: {
                branches: {
                    include: {
                        laundries: true, // Include the laundry for each branch
                    },
                },
            },
        });

        if (!mainVendor) {
            throw new NotFoundException('Main vendor not found');
        }

        if (mainVendor.mainVendorId !== null) {
            throw new BadRequestException('Specified vendor is not a main vendor');
        }

        return {
            mainVendor: {
                id: mainVendor.id,
                phone: mainVendor.phone,
                laundryName: mainVendor.laundryName,
                status: mainVendor.status,
            },
            branches: mainVendor.branches.map((branch) => ({
                id: branch.id,
                phone: branch.phone,
                laundryName: branch.laundryName,
                status: branch.status,
                laundryId: branch.laundries[0]?.id || null,
                createdAt: branch.createdAt,
            })),
            totalBranches: mainVendor.branches.length,
        };
    }
}
