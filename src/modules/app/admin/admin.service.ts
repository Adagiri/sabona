import { Injectable, NotFoundException } from '@nestjs/common';
import DatabaseService from '../../../database/database.service';
import { AllOrderListDto } from './dto/response/allorderlist.response.dto';
import FindUsersRequestDTO from '../user/dto/request/find.request';
import FindUsersResponseDTO from '../user/dto/response/find.response';
import { DeliveryStatus, OrderStatus, PaymentStatus, Prisma, ServiceChargeType, User, UserStatus, UserType } from '@prisma/client';
import {
    extractTokens,
    GetDateFilterOptions,
    GetOrderOptions,
    GetPaginationOptions,
    GetSlotFilterOptions,
} from 'src/helpers/util.helper';
import FindOrderRequestDTO from './dto/request/find.request';
import FindApplicationRequestDTO, {
    AdminSearchMainVendorsRequestDTO,
    ApproveApplicationRequestDTO,
    RejectApplicationRequestDTO,
    UploadApplicationDocumentsRequestDTO,
} from './dto/request/application.request';
import { BadRequestException } from 'src/core/exceptions/response.exception';
import ApplicationApproveMessageResponseDTO from './dto/response/approve.response.dto';
import NotificationService from '../notification/notification.service';
import { AllUserLocationsResponseDTO } from './dto/response/alluserlocation.response.dto';
import { CreateCouponRequest } from './dto/request/createCoupon.request';
import { CreateCouponResponseDTO } from './dto/response/createCoupon.response';
import PaginatedRequest from 'src/core/request/paginated.request';
import { CouponUsagePaginatedResponseDTO } from './dto/response/couponUsage.response';
import S3Service from '../media/s3.service';
import { UserDto } from './dto/response/userdetails.response';
import { SlotRequest } from '../customer/dto/request/slotRequest';
import { AllTipsResponseDTO } from './dto/response/allTips.response';
import {
    ApplicationRejectMessageResponseDTO,
    UploadApplicationDocumentsResponseDTO,
} from './dto/response/application.response';
import { MainVendorSearchResultDTO } from './dto/response/vendor.response';
import MediaService from '../media/media.service';
import { UpdateAdminSettingsRequestDTO } from './dto/request/updateAdminSettings.request';
import { BooleanResponseDTO } from 'src/core/response/response.schema';
import { GetAdminSettingsResponseDTO } from './dto/response/adminSettings.response';
import { DeleteUserRequestDTO } from './dto/request/deleteUser.request';
import { DeleteUserResponseDTO } from './dto/response/deleteUser.response';
import {
    DEFAULT_LAUNDRY_TEMPLATE,
    DEFAULT_SERVICES,
} from '../../../constants/laundry-template';
import PayTabsService from '../paytabs/paytabs.service';
import { EditUserRequestDTO, ChangePhoneRequestDTO, ChangeEmailRequestDTO } from './dto/request/editUser.request';
import { EditUserResponseDTO, ChangePhoneResponseDTO, ChangeEmailResponseDTO } from './dto/response/editUser.response';
import {
    isValidSaudiPhone,
    normalizeSaudiPhone,
    isValidEmail,
    normalizeEmail,
    isValidName,
} from '../../../helpers/validation.helper';

@Injectable()
export default class AdminService {
    constructor(
        private _dbService: DatabaseService,
        private _notificationService: NotificationService,
        private _s3service: S3Service,
        private _mediaService: MediaService,
        private _payTabsService: PayTabsService,
    ) {}

    async GetAllOrders(data: FindOrderRequestDTO): Promise<AllOrderListDto> {
        const where: Prisma.OrderWhereInput = {
            ...(!!data.type && { status: data.type }), // Only include 'status' condition if it exists

            ...(data.orderType && { orderType: data.orderType }),
        };

        // Get pagination and order options
        const pagination = GetPaginationOptions(data);
        const order = GetOrderOptions(data);

        // Fetch orders with filtering, pagination, and ordering
        const orders = await this._dbService.order.findMany({
            where,
            select: {
                id: true,
                status: true,
                orderType: true,
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        phone: true,
                    },
                },
                totalAmount: true,
                coupon: {
                    select: {
                        code: true,
                        id: true,
                    },
                },
                riderOrders: {
                    select: {
                        rider: {
                            select: {
                                firstName: true,
                                lastName: true,
                                phone: true,
                            },
                        },
                    },
                },
                services: {
                    select: {
                        items: {
                            select: {
                                quantity: true,
                            },
                        },
                    },
                },
                laundry: {
                    select: {
                        name: true,
                        vendor: {
                            select: {
                                phone: true,
                            },
                        },
                    },
                },
                delivery: {
                    select: {
                        rider: {
                            select: {
                                firstName: true,
                                lastName: true,
                                phone: true,
                            },
                        },
                    },
                },
                pickup: {
                    select: {
                        rider: {
                            select: {
                                firstName: true,
                                lastName: true,
                                phone: true,
                            },
                        },
                        pickupLat: true,
                        pickupLong: true,
                        pickupAddress: true,
                    },
                },
            },
            ...pagination,
            orderBy: order,
        });

        if (!orders) {
            throw new BadRequestException('Error fetching orders');
        }

        // Calculate totalQuantity for each order
        const ordersWithTotalQuantity = orders.map((order) => {
            const totalQuantity = order.services.reduce((orderTotal, service) => {
                const serviceTotal = service.items.reduce((itemTotal, item) => itemTotal + item.quantity, 0);
                return orderTotal + serviceTotal;
            }, 0);

            return {
                ...order,
                totalQuantity,
            };
        });

        // Count total number of orders matching the condition
        const count = await this._dbService.order.count({
            where,
        });

        return { data: ordersWithTotalQuantity, count };
    }

    async Find(data: FindUsersRequestDTO): Promise<FindUsersResponseDTO> {
        const where: Prisma.UserWhereInput = {
            ...(!!data.type && { type: data.type }),
            ...GetDateFilterOptions(data.dateFilter),
        };
        const pagination = GetPaginationOptions(data);
        const order = GetOrderOptions(data);

        const users = await this._dbService.user.findMany({
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                type: true,
                phone: true,
                createdAt: true,
                updatedAt: true,
                status: true,
                level: UserType.USER === data.type ? true : false,
                medias: {
                    where: {
                        deletedAt: null,
                    },
                    select: {
                        id: true,
                        location: true,
                        status: true,
                    },
                },
            },
            where,
            ...pagination,
            orderBy: order,
        });

        const count = await this._dbService.user.count({
            where,
        });

        return { data: users, count };
    }

    async GetAllApplications(data: FindApplicationRequestDTO): Promise<FindUsersResponseDTO> {
        const where: Prisma.UserWhereInput = {
            ...(!!data.type && { type: data.type }),
            ...{ status: UserStatus.INACTIVE },
        };
        const pagination = GetPaginationOptions(data);
        const order = GetOrderOptions(data);

        const applications = await this._dbService.user.findMany({
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                createdAt: true,
                updatedAt: true,
                status: true,
                type: true,
            },
            where,
            ...pagination,
            orderBy: order,
        });

        const count = await this._dbService.user.count({
            where,
        });

        return { data: applications, count };
    }

    async searchMainVendors(data: AdminSearchMainVendorsRequestDTO): Promise<MainVendorSearchResultDTO[]> {
        const limit = Math.min(data.limit || 50, 100); // Cap at 100 results max

        const mainVendors = await this._dbService.user.findMany({
            where: {
                type: UserType.VENDOR,
                status: UserStatus.ACTIVE,
                deletedAt: null,
                settings: {
                    laundryName: {
                        contains: data.laundryName,
                        mode: 'insensitive',
                    },
                },
                vendorRelationAsBranch: null, // User is not a branch of another vendor
            },
            include: {
                settings: {
                    select: {
                        laundryName: true,
                    },
                },
                vendorRelationAsMain: true, // Get all branch relations
            },
            orderBy: [
                // Prioritize exact matches
                {
                    settings: {
                        laundryName: 'asc',
                    },
                },
                { createdAt: 'desc' },
            ],
            take: limit, // Limit results
        });

        return mainVendors.map((vendor) => ({
            id: vendor.id,
            phone: vendor.phone,
            laundryName: vendor.settings?.laundryName || null,
            branchCount: vendor.vendorRelationAsMain.length,
            createdAt: vendor.createdAt,
        }));
    }

    async ApproveApplication(
        userId: string,
        data: ApproveApplicationRequestDTO,
    ): Promise<ApplicationApproveMessageResponseDTO> {
        const user = await this._dbService.user.findUnique({
            where: { id: userId },
            include: {
                settings: {
                    select: {
                        isOnboardingCompleted: true,
                        laundryName: true,
                        long: true,
                        lat: true,
                    },
                },
            },
        });

        if (!user) {
            throw new BadRequestException('User not found');
        }

        if (user.type === UserType.VENDOR && (!data.contactPhone || !data.addressLocale)) {
            throw new BadRequestException(
                'For vendor application, address, addressLocale, and contact phone fields are required',
            );
        }

        if (user.status === UserStatus.ACTIVE) {
            throw new BadRequestException('Application is already approved');
        }

        if (user.status === UserStatus.REJECTED) {
            throw new BadRequestException('Application was already rejected');
        }

        // Validate main vendor if provided
        if (data.mainVendorId) {
            const mainVendor = await this._dbService.user.findUnique({
                where: { id: data.mainVendorId },
            });

            if (!mainVendor) {
                throw new NotFoundException('Main vendor not found');
            }

            const isBranch = await this._dbService.vendorRelation.findUnique({
                where: { branchId: data.mainVendorId },
            });

            if (isBranch) {
                throw new BadRequestException('Specified vendor is not a main vendor');
            }

            if (mainVendor.status !== UserStatus.ACTIVE) {
                throw new BadRequestException('Main vendor must be approved');
            }
        }

        await this._dbService.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: userId },
                data: {
                    status: UserStatus.ACTIVE,
                },
            });

            await tx.userSettings.update({
                where: { userId: userId },

                data: {
                    isOnboardingCompleted: true,
                    contactPhone: data.contactPhone,
                },
            });

            if (data.mainVendorId) {
                await tx.vendorRelation.upsert({
                    where: { branchId: userId },
                    update: { mainVendorId: data.mainVendorId },
                    create: {
                        branchId: userId,
                        mainVendorId: data.mainVendorId,
                    },
                });
            } else {
                // Remove vendor relation if exists
                await tx.vendorRelation.deleteMany({
                    where: { branchId: userId },
                });
            }

            if (user.type === UserType.VENDOR) {
                // Create laundry with default services and items
                const laundry = await tx.laundry.create({
                    data: {
                        name: user.settings?.laundryName || 'Default Laundry Name',
                        long: user.settings?.long || 0,
                        lat: user.settings?.lat || 0,
                        addressLocale: data.addressLocale,
                        address: data.addressLocale.en,
                        vendorId: user.id,
                    },
                });

                // Fetch all categories to map items
                const categories = await tx.laundryItemCategory.findMany({
                    where: { deletedAt: null },
                });

                // Create a map of category names to their IDs
                const categoryMap = new Map(categories.map((cat) => [cat.name, cat.id]));

                // Create both default services with their items
                for (const serviceTemplate of DEFAULT_SERVICES) {
                    // Create the service
                    const service = await tx.laundryService.create({
                        data: {
                            laundryId: laundry.id,
                            name: serviceTemplate.nameLocale.en,
                            nameLocale: serviceTemplate.nameLocale,
                            description: serviceTemplate.descriptionLocale.en,
                            descriptionLocale: serviceTemplate.descriptionLocale,
                            sortOrder: serviceTemplate.sortOrder,
                        },
                    });

                    // Create all items for this service from the template
                    const itemsToCreate = [];
                    let sortOrderCounter = 1;

                    for (const [categoryName, categoryTemplate] of Object.entries(DEFAULT_LAUNDRY_TEMPLATE)) {
                        const categoryId = categoryMap.get(categoryName);

                        if (categoryId) {
                            for (const item of categoryTemplate.items) {
                                itemsToCreate.push({
                                    laundryServiceId: service.id,
                                    categoryId: categoryId,
                                    name: item.nameLocale.en,
                                    nameLocale: item.nameLocale,
                                    vendorPrice: item.vendorPrice,
                                    platformPrice: item.platformPrice,
                                    expressVendorPrice: item.expressVendorPrice,
                                    expressPlatformPrice: item.expressPlatformPrice,
                                    sortOrder: sortOrderCounter++,
                                });
                            }
                        }
                    }

                    // Batch create all items for this service
                    if (itemsToCreate.length > 0) {
                        await tx.laundryServiceItem.createMany({
                            data: itemsToCreate,
                        });
                    }
                }
            }
        });

        // Send notifications (outside transaction for performance)
        const deviceTokens = await this._dbService.deviceToken.findMany({
            where: {
                userId: userId,
                deletedAt: null,
            },
            select: {
                token: true,
            },
        });

        const userTokens = extractTokens(deviceTokens);

        const notificationPayload = {
            tokens: userTokens,
            title: 'Application Approved',
            body: 'Your application has been approved successfully',
            notificationData: {
                orderId: '',
                key: 'FETCH_USER_DETAILS',
                route: '',
            },
        };

        if (userTokens?.length) {
            try {
                const res = await this._notificationService.SendNotificationToMultipleTokens(notificationPayload);
                console.log(
                    'RESS',
                    res?.responses?.map((e) => {
                        console.log('ERROR', e);
                    }),
                );
            } catch (error) {
                console.log('error', error);
            }
        } else {
            console.log('NO TOKENS TO SEND NOTIFICATION');
        }

        return { message: 'Application approved successfully' };
    }

    async RejectApplication(
        userId: string,
        data: RejectApplicationRequestDTO,
    ): Promise<ApplicationRejectMessageResponseDTO> {
        const vendor = await this._dbService.user.findUnique({
            where: { id: userId },
            include: {
                settings: true,
            },
        });

        if (!vendor) {
            throw new NotFoundException('Vendor not found');
        }

        if (vendor.status !== UserStatus.INACTIVE) {
            throw new BadRequestException('Vendor is not in pending status');
        }

        await this._dbService.$transaction([
            this._dbService.user.update({
                where: { id: vendor.id },
                data: { status: UserStatus.REJECTED },
            }),
            this._dbService.userSettings.update({
                where: { userId: vendor.id },
                data: { rejectionReason: data.rejectionReason },
            }),
        ]);

        return {
            message: 'Vendor rejected successfully',
        };
    }

    async GetCustomersLocation(): Promise<AllUserLocationsResponseDTO> {
        const users = await this._dbService.user.findMany({
            select: {
                id: true,
                settings: {
                    select: {
                        lat: true,
                        long: true,
                    },
                },
            },
            where: {
                type: UserType.USER,
            },
        });

        if (!users) {
            throw new BadRequestException('Error fetching users');
        }

        return { data: users };
    }

    async createCoupon(data: CreateCouponRequest): Promise<CreateCouponResponseDTO> {
        // Check if coupon code already exists
        const existingCoupon = await this._dbService.coupon.findFirst({
            where: {
                code: data.code,
                deletedAt: null,
            },
        });

        if (existingCoupon) {
            throw new BadRequestException('Coupon code already exists');
        }

        const coupon = await this._dbService.coupon.create({
            data: {
                code: data.code,
                nameLocale: data.nameLocale,
                name: data.nameLocale.en,
                discount: data.discount,
                type: data.type,
                maxDiscount: data.maxDiscount,
                minOrderAmount: data.minOrderAmount,
                expiryDate: data.expiryDate,
                startDate: data.startDate,
                usageLimit: data.usageLimit,
                singleUse: data.singleUse,
                isActive: data.isActive ?? true,
            },
        });

        return {
            ...coupon,
        };
    }

    async getCoupons(data: PaginatedRequest): Promise<any> {
        const pagination = GetPaginationOptions(data);
        const couponsTotal = await this._dbService.coupon.findMany({
            select: {
                id: true,
                code: true,
                name: true,
                discount: true,
                type: true,
                maxDiscount: true,
                startDate: true,
                expiryDate: true,
                usageLimit: true,
                singleUse: true,
                minOrderAmount: true,
                isActive: true,
            },
        });
        const couponsPaginated = await this._dbService.coupon.findMany({
            select: {
                id: true,
                code: true,
                name: true,
                discount: true,
                type: true,
                maxDiscount: true,
                startDate: true,
                expiryDate: true,
                usageLimit: true,
                singleUse: true,
                minOrderAmount: true,
                isActive: true,
            },
            ...pagination,
            orderBy: {
                createdAt: 'desc',
            },
        });

        if (!couponsPaginated) {
            throw new BadRequestException('Error fetching coupons');
        }
        const res = {
            count: couponsTotal.length,
            coupons: couponsPaginated,
        };
        return res;
    }

    async getCouponUsage(id: string, query: PaginatedRequest): Promise<CouponUsagePaginatedResponseDTO> {
        const pagination = GetPaginationOptions(query);
        const coupon = await this._dbService.coupon.findUnique({
            where: {
                id,
            },
            select: {
                name: true,
                code: true,
                isActive: true,
                expiryDate: true,
                discount: true,
                type: true,
            },
        });

        if (!coupon) {
            throw new BadRequestException('Coupon not found');
        }
        const couponDetails = await this._dbService.couponUsage.findMany({
            where: {
                couponId: id,
            },
        });

        const couponCount = await this._dbService.couponUsage.findMany({
            where: {
                couponId: id,
            },
            distinct: ['userId'],
        });

        const couponUsagePaginated = await this._dbService.couponUsage.findMany({
            where: {
                couponId: id,
            },
            select: {
                id: true,
                userId: true,
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        phone: true,
                    },
                },
                coupon: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                    },
                },
            },
            distinct: ['userId'],
            ...pagination,
        });

        const couponUsageWithFilteredOrders = await Promise.all(
            couponUsagePaginated.map(async (usage) => {
                const orders = await this._dbService.order.findMany({
                    where: {
                        couponId: id,
                        userId: usage.userId, // Filter orders by the current userId
                    },
                    select: {
                        id: true,
                        totalAmount: true,
                        userId: true,
                        orderNumber: true,
                    },
                });

                return {
                    ...usage,
                    coupon: {
                        ...usage.coupon,
                        orders, // Attach filtered orders
                    },
                };
            }),
        );

        if (!couponUsagePaginated) {
            throw new Error('Coupon usage not found');
        }

        return {
            data: {
                usage: couponUsageWithFilteredOrders,
                totalUsageCount: couponDetails.length,
                count: couponCount.length,
                coupon,
            },
        };
    }

    async GetUserDetails(userId: string): Promise<UserDto> {
        const user = await this._dbService.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                type: true,
                status: true,
                receivedTips: true,
                createdAt: true,
                medias: {
                    where: { deletedAt: null },
                    select: {
                        id: true,
                        location: true,
                        status: true,
                    },
                },
            },
        });

        if (user.medias?.length) {
            user.medias = await Promise.all(
                user.medias.map(async (media) => ({
                    ...media,
                    location: await this._s3service.GetSignedUrl(media.location),
                })),
            );
        }

        if (!user) {
            throw new BadRequestException('User not found');
        }

        return user;
    }

    async GetDriverTips(userId: string, data: SlotRequest): Promise<any> {
        const slotFilter = GetSlotFilterOptions(data.startDate, data.endDate);

        const driver = await this._dbService.user.findFirst({
            where: {
                id: userId,
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                receivedTips: {
                    where: {
                        paid: true,
                        ...slotFilter,
                    },
                    select: {
                        id: true,
                        amount: true,
                        paid: true,
                        orderId: true,
                        createdAt: true,
                    },
                },
            },
        });

        if (!driver) {
            throw new BadRequestException('Driver not found');
        }

        return driver;
    }

    async GetAllTips(data: PaginatedRequest): Promise<AllTipsResponseDTO> {
        const pagination = GetPaginationOptions(data);

        const tips = await this._dbService.tip.findMany({
            where: {
                paid: true,
            },
        });

        const paginatedTips = await this._dbService.tip.findMany({
            where: {
                paid: true,
            },
            select: {
                id: true,
                amount: true,
                createdAt: true,
                riderId: true,
                transactionId: true,
                orderId: true,
            },
            ...pagination,
            orderBy: {
                createdAt: 'desc',
            },
        });

        if (!paginatedTips) {
            throw new BadRequestException('Error fetching tips');
        }

        return { data: paginatedTips, count: tips.length };
    }

    async getSubVendorsForMainVendor(mainVendorId: string) {
        const mainVendor = await this._dbService.user.findUnique({
            where: { id: mainVendorId },
            include: {
                settings: { select: { laundryName: true } },
            },
        });

        if (!mainVendor) {
            throw new NotFoundException('Main vendor not found');
        }

        const isBranch = await this._dbService.vendorRelation.findFirst({
            where: { branchId: mainVendorId },
        });

        console.log(mainVendorId);
        if (isBranch) {
            throw new BadRequestException('Specified vendor is not a main vendor');
        }

        const branches = await this._dbService.vendorRelation.findMany({
            where: { mainVendorId },
            include: {
                branch: {
                    include: {
                        settings: { select: { laundryName: true } },
                    },
                },
            },
        });

        const subVendors = branches.map((relation) => ({
            id: relation.branch.id,
            phone: relation.branch.phone,
            laundryName: relation.branch.settings?.laundryName || null,
            status: relation.branch.status,
            createdAt: relation.branch.createdAt,
        }));

        return {
            mainVendor: {
                id: mainVendor.id,
                phone: mainVendor.phone,
                laundryName: mainVendor.settings?.laundryName,
                status: mainVendor.status,
            },
            subVendors,
            totalSubVendors: subVendors.length,
        };
    }

    async getApplicationDocuments(userId: string) {
        const documents = await this._dbService.media.findMany({
            where: {
                userId,
                meta: {
                    path: ['uploadedFor'],
                    equals: 'application-verification',
                },
            },
            select: {
                id: true,
                name: true,
                path: true,
                location: true,
                access: true,
                meta: true,
                status: true,
                updatedAt: true,
            },
        });

        function hasDocType(meta: any): meta is { docType: string } {
            return meta && typeof meta === 'object' && typeof meta.docType === 'string';
        }

        // Helper function to get the appropriate URL for viewing
        const getViewableUrl = async (doc: any) => {
            // Only return URLs for ready media
            if (doc.status !== 'READY') {
                return null;
            }

            if (doc.access === 'PUBLIC') {
                // Public media can use the direct path
                return doc.path;
            } else {
                // Private media needs a signed URL
                try {
                    const signedUrlResponse = await this._mediaService.GetSignedUrl(doc.location);
                    return signedUrlResponse.message; // The signed URL is in the message field
                } catch (error) {
                    console.error(`Failed to get signed URL for media ${doc.id}:`, error);
                    return null;
                }
            }
        };

        const getLatestDocumentByType = (documents: any[], docType: string) => {
            return documents
                .filter((doc) => hasDocType(doc.meta) && doc.meta.docType === docType)
                .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
        };

        const vatNumberDoc = getLatestDocumentByType(documents, 'VAT_NUMBER_DOC');
        const businessCertDoc = getLatestDocumentByType(documents, 'BUSINESS_CERT_DOC');
        // Build response with viewable URLs
        const response: any = {};

        if (vatNumberDoc) {
            response.vatNumberDoc = {
                id: vatNumberDoc.id,
                name: vatNumberDoc.name,
                url: await getViewableUrl(vatNumberDoc),
                access: vatNumberDoc.access,
                status: vatNumberDoc.status,
                updatedAt: vatNumberDoc.updatedAt,
            };
        }

        if (businessCertDoc) {
            response.businessCertDoc = {
                id: businessCertDoc.id,
                name: businessCertDoc.name,
                url: await getViewableUrl(businessCertDoc),
                access: businessCertDoc.access,
                status: businessCertDoc.status,
                updatedAt: vatNumberDoc.updatedAt,
            };
        }

        return response;
    }

    async uploadApplicationDocuments(
        userId: string,
        data: UploadApplicationDocumentsRequestDTO,
    ): Promise<UploadApplicationDocumentsResponseDTO> {
        const vendor = await this._dbService.user.findUnique({
            where: { id: userId },
        });

        if (!vendor) {
            throw new NotFoundException('Vendor not found');
        }

        // Verify both documents exist
        const [vatDoc, businessDoc] = await Promise.all([
            this._dbService.media.findUnique({
                where: { id: parseInt(data.vatNumberDocId) },
            }),
            this._dbService.media.findUnique({
                where: { id: parseInt(data.businessCertDocId) },
            }),
        ]);

        if (!vatDoc || !businessDoc) {
            throw new NotFoundException('One or both documents not found');
        }

        // Prepare metadata
        const vatDocMeta = {
            ...((vatDoc.meta as object) || {}),
            docType: 'VAT_NUMBER_DOC',
            uploadedFor: 'application-verification',
            uploadedBy: 'admin',
        };

        const businessDocMeta = {
            ...((businessDoc.meta as object) || {}),
            docType: 'BUSINESS_CERT_DOC',
            uploadedFor: 'application-verification',
            uploadedBy: 'admin',
        };

        // Execute all updates in a transaction
        await this._dbService.$transaction(async (tx) => {
            // 1. Update VAT document
            await tx.media.update({
                where: { id: vatDoc.id },
                data: {
                    userId: vendor.id,
                    meta: vatDocMeta,
                },
            });

            // 2. Update Business document
            await tx.media.update({
                where: { id: businessDoc.id },
                data: {
                    userId: vendor.id,
                    meta: businessDocMeta,
                },
            });

            // 3. Update or create user settings
            await tx.userSettings.upsert({
                where: { userId: vendor.id },
                create: {
                    userId: vendor.id,
                    isDocumentsUploaded: true,
                },
                update: {
                    isDocumentsUploaded: true,
                },
            });
        });

        return {
            success: true,
            message: 'Vendor documents uploaded successfully',
            vendorId: vendor.id,
        };
    }

    async uploadRiderDocument(userId: string, data: { driverLicenseDocId: string }) {
        // Validate that the user is a rider
        const rider = await this._dbService.user.findUnique({
            where: {
                id: userId,
                type: 'RIDER',
                deletedAt: null,
            },
            include: {
                settings: true,
            },
        });

        if (!rider) {
            throw new BadRequestException('Rider not found or invalid user type');
        }

        // Validate that the media exists and is in ready status
        const driverLicenseDoc = await this._dbService.media.findUnique({
            where: { id: parseInt(data.driverLicenseDocId) },
        });

        if (!driverLicenseDoc) {
            throw new BadRequestException('Driver license document not found');
        }

        if (driverLicenseDoc.status !== 'READY') {
            throw new BadRequestException('Driver license document is not ready for use');
        }

        // Check if rider already has documents uploaded
        const existingDocs = await this._dbService.media.findMany({
            where: {
                userId: rider.id,
                meta: {
                    path: ['uploadedFor'],
                    equals: 'rider-verification',
                },
            },
        });

        if (existingDocs.length > 0) {
            throw new BadRequestException('Rider documents already exist. Use update endpoint instead.');
        }

        // Use transaction to ensure consistency
        await this._dbService.$transaction(async (tx) => {
            // Define metadata for driver license document
            const driverLicenseMeta = {
                docType: 'DRIVER_LICENSE_DOC',
                uploadedFor: 'rider-verification',
                uploadedBy: 'ADMIN',
                uploadedAt: new Date().toISOString(),
            };

            // Update driver license document
            await tx.media.update({
                where: { id: driverLicenseDoc.id },
                data: {
                    userId: rider.id,
                    meta: driverLicenseMeta,
                },
            });

            // Update or create user settings
            await tx.userSettings.upsert({
                where: { userId: rider.id },
                create: {
                    userId: rider.id,
                    isDocumentsUploaded: true,
                },
                update: {
                    isDocumentsUploaded: true,
                },
            });
        });

        return {
            success: true,
            message: 'Rider documents uploaded successfully',
            riderId: rider.id,
        };
    }

    async finalizeRiderDocument(userId: string, data: { documentType: string; uploadId: string }) {
        // Validate that the user is a rider
        const rider = await this._dbService.user.findUnique({
            where: {
                id: userId,
                type: 'RIDER',
                deletedAt: null,
            },
        });

        if (!rider) {
            throw new BadRequestException('Rider not found or invalid user type');
        }

        // Validate document type
        const allowedDocTypes = ['DRIVER_LICENSE_DOC'];
        if (!allowedDocTypes.includes(data.documentType)) {
            throw new BadRequestException('Invalid document type for rider');
        }

        // Find the media by uploadId (assuming uploadId maps to media ID)
        const media = await this._dbService.media.findUnique({
            where: { id: parseInt(data.uploadId) },
        });

        if (!media) {
            throw new BadRequestException('Document not found');
        }

        if (media.status !== 'READY') {
            throw new BadRequestException('Document is not ready for finalization');
        }

        // Update media with finalization metadata
        const updatedMedia = await this._dbService.media.update({
            where: { id: media.id },
            data: {
                userId: rider.id,
                meta: {
                    ...((media.meta as object) || {}),
                    docType: data.documentType,
                    uploadedFor: 'rider-verification',
                    finalizedAt: new Date().toISOString(),
                    finalizedBy: 'ADMIN',
                },
            },
        });

        return {
            success: true,
            message: 'Rider document finalized successfully',
            document: {
                id: updatedMedia.id,
                type: data.documentType,
                status: updatedMedia.status,
                path: updatedMedia.path,
            },
        };
    }

    async getRiderDocuments(userId: string) {
        const documents = await this._dbService.media.findMany({
            where: {
                userId,
                meta: {
                    path: ['uploadedFor'],
                    equals: 'rider-verification',
                },
            },
            select: {
                id: true,
                name: true,
                path: true,
                location: true,
                access: true,
                meta: true,
                status: true,
                updatedAt: true,
            },
        });

        function hasDocType(meta: any): meta is { docType: string } {
            return meta && typeof meta === 'object' && typeof meta.docType === 'string';
        }

        // Helper function to get viewable URL
        const getViewableUrl = async (doc: any) => {
            if (doc.status !== 'READY') {
                return null;
            }

            if (doc.access === 'PUBLIC') {
                return doc.path;
            } else {
                try {
                    const signedUrlResponse = await this._mediaService.GetSignedUrl(doc.location);
                    return signedUrlResponse.message;
                } catch (error) {
                    console.error(`Failed to get signed URL for media ${doc.id}:`, error);
                    return null;
                }
            }
        };

        // Helper function to get latest document by type
        const getLatestDocumentByType = (documents: any[], docType: string) => {
            return documents
                .filter((doc) => hasDocType(doc.meta) && doc.meta.docType === docType)
                .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]; // Get the most recent one
        };

        // Find latest driver license document
        const driverLicenseDoc = getLatestDocumentByType(documents, 'DRIVER_LICENSE_DOC');

        // Build response with viewable URLs
        const response = {
            driverLicense: driverLicenseDoc
                ? {
                      id: driverLicenseDoc.id,
                      name: driverLicenseDoc.name,
                      status: driverLicenseDoc.status,
                      uploadedAt: driverLicenseDoc.updatedAt,
                      viewUrl: await getViewableUrl(driverLicenseDoc),
                  }
                : null,
            hasAllDocuments: !!driverLicenseDoc,
            totalDocuments: documents.length,
            // Additional info about document versions
            totalDriverLicenseVersions: documents.filter(
                (doc) => hasDocType(doc.meta) && doc.meta.docType === 'DRIVER_LICENSE_DOC',
            ).length,
        };

        return response;
    }

    async getAdminSettings(): Promise<GetAdminSettingsResponseDTO> {
        let settings = await this._dbService.adminSettings.findFirst({ where: { deletedAt: null } });

        if (!settings) {
            settings = await this._dbService.adminSettings.create({
                data: {
                    vatRate: 0.15,
                    vatEnabled: true,
                    serviceChargeType: 'PERCENTAGE',
                    serviceChargeRate: 7.0,
                    customOrderServiceChargeRate: 10.0,
                    deliveryBaseRate: 5.0,
                    deliveryPerKmRate: 2.0,
                    freeDeliveryThreshold: 100.0,
                    expressMultiplier: 2.0,
                    maxDeliveryDistance: 50.0,
                },
            });
        }

        return {
            message: 'Admin settings retrieved successfully',
            data: settings,
        };
    }

    async updateAdminSettings(data: UpdateAdminSettingsRequestDTO): Promise<BooleanResponseDTO> {
        const settings = await this._dbService.adminSettings.findFirst({ where: { deletedAt: null } });

        if (settings) {
            await this._dbService.adminSettings.update({
                where: { id: settings.id },
                data: {
                    ...data,
                    updatedAt: new Date(),
                },
            });
        } else {
            await this._dbService.adminSettings.create({
                data: {
                    vatRate: 0.15,
                    vatEnabled: true,
                    serviceChargeType: ServiceChargeType.PERCENTAGE,
                    serviceChargeRate: 7.0,
                    customOrderServiceChargeRate: 10.0,
                    deliveryBaseRate: 5.0,
                    deliveryPerKmRate: 2.0,
                    freeDeliveryThreshold: 100.0,
                    expressMultiplier: 2.0,
                    maxDeliveryDistance: 50.0,
                    ...data,
                },
            });
        }

        return {
            data: true,
        };
    }

    async cancelOrder(orderId: string, reason: string): Promise<any> {
        const order = await this._dbService.order.findUnique({
            where: { id: orderId },
            include: {
                user: true,
                payment: true,
            },
        });

        if (!order) {
            throw new BadRequestException('Order not found');
        }

        if (order.status === OrderStatus.CANCELLED) {
            throw new BadRequestException('Order already cancelled');
        }

        // Process refund BEFORE database transaction if order was paid
        let refundProcessed = false;
        if (order.paid && order.payment?.transactionRef) {
            try {
                await this._payTabsService.processRefund(
                    order.payment.transactionRef,
                    order.totalAmount,
                    orderId,
                    reason,
                );
                refundProcessed = true;
                console.log(`Refund processed successfully for order ${orderId}`);
            } catch (error) {
                console.error(`Failed to process refund for order ${orderId}:`, error);
                throw new BadRequestException(
                    `Failed to process refund: ${error.message}. Order cancellation aborted.`,
                );
            }
        }

        // Update database in transaction
        await this._dbService.$transaction(async (tx) => {
            // Cancel the order
            await tx.order.update({
                where: { id: orderId },
                data: {
                    status: OrderStatus.CANCELLED,
                    cancelReason: reason,
                    ...(refundProcessed && {
                        paid: false,
                        paymentStatus: PaymentStatus.REFUNDED,
                    }),
                },
            });

            // Add status history
            await tx.orderStatusHistory.create({
                data: {
                    orderId,
                    status: OrderStatus.CANCELLED,
                    timestamp: new Date(),
                },
            });

            // Update payment record if refund was processed
            if (refundProcessed && order.payment) {
                await tx.payment.update({
                    where: { orderId },
                    data: {
                        status: 'REFUNDED',
                        type: 'Refund',
                    },
                });
            }

            // Clean up VendorOrder (soft delete)
            await tx.vendorOrder.updateMany({
                where: { orderId },
                data: { deletedAt: new Date() },
            });

            // Clean up Pickup (unassign rider and mark as cancelled)
            const pickup = await tx.pickup.findUnique({ where: { orderId } });
            if (pickup) {
                await tx.pickup.update({
                    where: { orderId },
                    data: {
                        status: OrderStatus.CANCELLED,
                        riderId: null,
                    },
                });
            }

            // Clean up Delivery (unassign rider and mark as cancelled)
            const delivery = await tx.delivery.findUnique({ where: { orderId } });
            if (delivery) {
                await tx.delivery.update({
                    where: { orderId },
                    data: {
                        status: DeliveryStatus.CANCELLED,
                        riderId: null,
                    },
                });
            }
        });

        // Notify customer
        const customerTokens = await this._dbService.deviceToken.findMany({
            where: { userId: order.userId, deletedAt: null },
        });

        if (customerTokens.length > 0) {
            const tokens = customerTokens.map((t) => t.token);
            const notificationBody = refundProcessed
                ? `Your order has been cancelled and refund has been processed. Reason: ${reason}`
                : `Your order has been cancelled. Reason: ${reason}`;

            await this._notificationService.SendNotificationToMultipleTokens({
                tokens,
                title: 'Order Cancelled',
                body: notificationBody,
                notificationData: {
                    orderId: order.id,
                    key: 'GET_ORDER_BY_ID',
                    route: 'TrackOrder',
                },
            });
        }

        return {
            message: 'Order cancelled successfully',
            refunded: refundProcessed,
        };
    }

    async deleteUser(userId: string, data: DeleteUserRequestDTO, adminUser: User): Promise<DeleteUserResponseDTO> {
        const user = await this._dbService.user.findUnique({
            where: { id: userId },
            include: {
                settings: true,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Prevent admin from deleting themselves
        if (user.id === adminUser.id) {
            throw new BadRequestException('Cannot delete your own account');
        }

        // Check for blocking conditions based on user type
        if (user.type === UserType.USER) {
            const activeOrders = await this._dbService.order.count({
                where: {
                    userId: user.id,
                    deletedAt: null,
                    status: {
                        in: ['PENDING', 'PENDING_PAYMENT', 'ACCEPTED', 'IN_PROGRESS', 'READY_FOR_PICKUP'],
                    },
                },
            });

            if (activeOrders > 0) {
                throw new BadRequestException(
                    `Cannot delete user with ${activeOrders} active order(s). Cancel orders first.`,
                );
            }
        }

        if (user.type === UserType.RIDER) {
            const activeAssignments = await this._dbService.riderOrder.count({
                where: {
                    riderId: user.id,
                    deletedAt: null,
                    order: {
                        status: {
                            in: ['ACCEPTED', 'IN_PROGRESS', 'READY_FOR_PICKUP'],
                        },
                    },
                },
            });

            if (activeAssignments > 0) {
                throw new BadRequestException(
                    `Cannot delete rider with ${activeAssignments} active delivery assignment(s).`,
                );
            }
        }

        if (user.type === UserType.VENDOR) {
            const activeOrders = await this._dbService.vendorOrder.count({
                where: {
                    vendorId: user.id,
                    deletedAt: null,
                    order: {
                        status: {
                            in: ['ACCEPTED', 'IN_PROGRESS', 'READY_FOR_PICKUP'],
                        },
                    },
                },
            });

            if (activeOrders > 0) {
                throw new BadRequestException(`Cannot delete vendor with ${activeOrders} active order(s) to process.`);
            }

            const activeLaundries = await this._dbService.laundry.count({
                where: {
                    vendorId: user.id,
                    deletedAt: null,
                },
            });

            if (activeLaundries > 0) {
                throw new BadRequestException(
                    `Cannot delete vendor with ${activeLaundries} active laundry/laundries. Delete laundries first.`,
                );
            }
        }

        // Use transaction to ensure atomicity
        await this._dbService.$transaction(async (tx) => {
            // 1. Store original phone/email in audit fields, then null out active fields
            await tx.user.update({
                where: { id: userId },
                data: {
                    // Audit fields - preserve for history (NOT INDEXED)
                    deletedPhone: user.phone,
                    deletedEmail: user.email,
                    deletionReason: data.reason || null,
                    deletedByAdminId: adminUser.id,

                    // Active fields - null to free for reuse (INDEXED)
                    phone: null,
                    email: user.email ? `deleted_${userId}@deleted.local` : null,
                },
            });

            // 2. Handle rider/vendor specific cleanup...
            if (user.type === UserType.RIDER) {
                await tx.riderOrder.updateMany({
                    where: { riderId: userId, deletedAt: null },
                    data: { deletedAt: new Date() },
                });

                await tx.pickup.updateMany({
                    where: { riderId: userId },
                    data: { riderId: null },
                });

                await tx.delivery.updateMany({
                    where: { riderId: userId },
                    data: { riderId: null },
                });
            }

            if (user.type === UserType.VENDOR) {
                await tx.vendorOrder.updateMany({
                    where: { vendorId: userId, deletedAt: null },
                    data: { deletedAt: new Date() },
                });
            }

            // 3. Soft delete the user
            await tx.user.delete({
                where: { id: userId },
            });

            // await tx.notification.create({
            //     data: {
            //         userId: adminUser.id,
            //         message: `Admin deleted ${user.type} account: ${user.firstName} ${user.lastName} (Phone: ${user.phone || 'N/A'}). Reason: ${data.reason || 'No reason provided'}`,
            //         status: 'UNREAD',
            //         type: 'OTHER',
            //         data: {
            //             action: 'USER_DELETION',
            //             deletedUserId: userId,
            //             deletedUserType: user.type,
            //             deletedPhone: user.phone,
            //             deletedEmail: user.email,
            //             reason: data.reason,
            //             timestamp: new Date().toISOString(),
            //         },
            //     },
            // });
        });

        return {
            message: `${user.type} account deleted successfully`,
            data: {
                userId: user.id,
                userType: user.type,
                phoneFreed: !!user.phone,
                emailFreed: !!user.email,
                deletedPhone: user.phone || undefined, // Return for confirmation
            },
        };
    }

    /**
     * Edit user profile
     * Allows admin to update user's name, email, phone, status, and level
     * Cannot edit admins
     */
    async editUser(userId: string, data: EditUserRequestDTO, adminUser: User): Promise<EditUserResponseDTO> {
        // Find the user to edit
        const user = await this._dbService.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Prevent editing admin users
        if (user.type === UserType.ADMIN) {
            throw new BadRequestException('Cannot edit admin users');
        }

        // Prevent admin from editing themselves (if they're not admin type, which is already blocked)
        if (user.id === adminUser.id) {
            throw new BadRequestException('Cannot edit your own account through this endpoint');
        }

        const changesApplied: string[] = [];
        const updateData: any = {};

        // Validate and update name
        if (data.name !== undefined && data.name !== user.name) {
            if (data.name && !isValidName(data.name)) {
                throw new BadRequestException(
                    'Invalid name format. Name must be 2-100 characters and contain only letters, spaces, hyphens, and apostrophes',
                );
            }
            updateData.name = data.name?.trim() || null;
            changesApplied.push('name');
        }

        // Validate and update email
        if (data.email !== undefined && data.email !== user.email) {
            const normalizedEmail = data.email ? normalizeEmail(data.email) : null;

            if (normalizedEmail && !isValidEmail(normalizedEmail)) {
                throw new BadRequestException('Invalid email format');
            }

            // Check if email is already in use by another active user
            if (normalizedEmail) {
                const existingUser = await this._dbService.user.findFirst({
                    where: {
                        email: normalizedEmail,
                        deletedAt: null,
                        id: { not: userId },
                    },
                });

                if (existingUser) {
                    throw new BadRequestException('Email is already in use by another user');
                }
            }

            // Log email change
            await this._dbService.emailChangeLog.create({
                data: {
                    userId: userId,
                    oldEmail: user.email,
                    newEmail: normalizedEmail || '',
                    changedBy: adminUser.id,
                    reason: 'Admin edited user profile',
                },
            });

            updateData.email = normalizedEmail;
            changesApplied.push('email');

            // Send notification to user about email change
            if (normalizedEmail) {
                const deviceTokens = await this._dbService.deviceToken.findMany({
                    where: {
                        userId: userId,
                        deletedAt: null,
                    },
                    select: {
                        token: true,
                    },
                });

                const userTokens = extractTokens(deviceTokens);

                if (userTokens?.length) {
                    try {
                        await this._notificationService.SendNotificationToMultipleTokens({
                            tokens: userTokens,
                            title: 'Email Address Updated',
                            body: `Your email address has been updated to ${normalizedEmail} by an administrator.`,
                            notificationData: {
                                orderId: '',
                                key: 'PROFILE_UPDATE',
                                route: '',
                            },
                        });
                    } catch (error) {
                        console.log('Error sending email change notification:', error);
                    }
                }
            }
        }

        // Validate and update phone
        if (data.phone !== undefined && data.phone !== user.phone) {
            const normalizedPhone = data.phone ? normalizeSaudiPhone(data.phone) : null;

            if (normalizedPhone && !isValidSaudiPhone(normalizedPhone)) {
                throw new BadRequestException('Invalid Saudi phone number format');
            }

            // Check if phone is already in use by another active user
            if (normalizedPhone) {
                const existingUser = await this._dbService.user.findFirst({
                    where: {
                        phone: normalizedPhone,
                        deletedAt: null,
                        id: { not: userId },
                    },
                });

                if (existingUser) {
                    throw new BadRequestException('Phone number is already in use by another user');
                }
            }

            // Log phone change
            await this._dbService.phoneChangeLog.create({
                data: {
                    userId: userId,
                    oldPhone: user.phone,
                    newPhone: normalizedPhone || '',
                    changedBy: adminUser.id,
                    reason: 'Admin edited user profile',
                },
            });

            updateData.phone = normalizedPhone;
            changesApplied.push('phone');

            // Send notification to user about phone change
            if (normalizedPhone) {
                const deviceTokens = await this._dbService.deviceToken.findMany({
                    where: {
                        userId: userId,
                        deletedAt: null,
                    },
                    select: {
                        token: true,
                    },
                });

                const userTokens = extractTokens(deviceTokens);

                if (userTokens?.length) {
                    try {
                        await this._notificationService.SendNotificationToMultipleTokens({
                            tokens: userTokens,
                            title: 'Phone Number Updated',
                            body: `Your phone number has been updated to ${normalizedPhone} by an administrator.`,
                            notificationData: {
                                orderId: '',
                                key: 'PROFILE_UPDATE',
                                route: '',
                            },
                        });
                    } catch (error) {
                        console.log('Error sending phone change notification:', error);
                    }
                }
            }
        }

        // Update status
        if (data.status !== undefined && data.status !== user.status) {
            updateData.status = data.status;
            changesApplied.push('status');
        }

        // Update level (only for customers)
        if (data.level !== undefined && data.level !== user.level) {
            if (user.type !== UserType.USER) {
                throw new BadRequestException('Level can only be set for customer users');
            }
            updateData.level = data.level;
            changesApplied.push('level');
        }

        // If no changes, return early
        if (Object.keys(updateData).length === 0) {
            return {
                data: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    status: user.status,
                    level: user.level,
                    type: user.type,
                    updatedAt: user.updatedAt,
                },
                message: 'No changes detected',
                changesApplied: [],
            };
        }

        // Update user
        const updatedUser = await this._dbService.user.update({
            where: { id: userId },
            data: updateData,
        });

        return {
            data: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone,
                status: updatedUser.status,
                level: updatedUser.level,
                type: updatedUser.type,
                updatedAt: updatedUser.updatedAt,
            },
            message: `User profile updated successfully`,
            changesApplied,
        };
    }

    /**
     * Change user's phone number with reason
     * Requires reason for audit trail
     */
    async changeUserPhone(
        userId: string,
        data: ChangePhoneRequestDTO,
        adminUser: User,
    ): Promise<ChangePhoneResponseDTO> {
        const user = await this._dbService.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (user.type === UserType.ADMIN) {
            throw new BadRequestException('Cannot edit admin users');
        }

        const normalizedPhone = normalizeSaudiPhone(data.newPhone);

        if (!isValidSaudiPhone(normalizedPhone)) {
            throw new BadRequestException('Invalid Saudi phone number format');
        }

        // Check if phone is already in use
        const existingUser = await this._dbService.user.findFirst({
            where: {
                phone: normalizedPhone,
                deletedAt: null,
                id: { not: userId },
            },
        });

        if (existingUser) {
            throw new BadRequestException('Phone number is already in use by another user');
        }

        // Log phone change with reason
        const changeLog = await this._dbService.phoneChangeLog.create({
            data: {
                userId: userId,
                oldPhone: user.phone,
                newPhone: normalizedPhone,
                changedBy: adminUser.id,
                reason: data.reason,
            },
        });

        // Update user phone
        await this._dbService.user.update({
            where: { id: userId },
            data: { phone: normalizedPhone },
        });

        // Send push notification to user
        const deviceTokens = await this._dbService.deviceToken.findMany({
            where: {
                userId: userId,
                deletedAt: null,
            },
            select: {
                token: true,
            },
        });

        const userTokens = extractTokens(deviceTokens);

        if (userTokens?.length) {
            try {
                await this._notificationService.SendNotificationToMultipleTokens({
                    tokens: userTokens,
                    title: 'Phone Number Updated',
                    body: `Your phone number has been updated to ${normalizedPhone}. Reason: ${data.reason}`,
                    notificationData: {
                        orderId: '',
                        key: 'PROFILE_UPDATE',
                        route: '',
                    },
                });
            } catch (error) {
                console.log('Error sending phone change notification:', error);
            }
        }

        return {
            data: {
                userId: userId,
                oldPhone: user.phone,
                newPhone: normalizedPhone,
                changedAt: changeLog.createdAt,
            },
            message: 'Phone number updated successfully',
        };
    }

    /**
     * Change user's email with optional reason
     */
    async changeUserEmail(
        userId: string,
        data: ChangeEmailRequestDTO,
        adminUser: User,
    ): Promise<ChangeEmailResponseDTO> {
        const user = await this._dbService.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (user.type === UserType.ADMIN) {
            throw new BadRequestException('Cannot edit admin users');
        }

        const normalizedEmail = normalizeEmail(data.newEmail);

        if (!isValidEmail(normalizedEmail)) {
            throw new BadRequestException('Invalid email format');
        }

        // Check if email is already in use
        const existingUser = await this._dbService.user.findFirst({
            where: {
                email: normalizedEmail,
                deletedAt: null,
                id: { not: userId },
            },
        });

        if (existingUser) {
            throw new BadRequestException('Email is already in use by another user');
        }

        // Log email change
        const changeLog = await this._dbService.emailChangeLog.create({
            data: {
                userId: userId,
                oldEmail: user.email,
                newEmail: normalizedEmail,
                changedBy: adminUser.id,
                reason: data.reason || 'Admin updated email',
            },
        });

        // Update user email
        await this._dbService.user.update({
            where: { id: userId },
            data: { email: normalizedEmail },
        });

        // Send push notification to user
        const deviceTokens = await this._dbService.deviceToken.findMany({
            where: {
                userId: userId,
                deletedAt: null,
            },
            select: {
                token: true,
            },
        });

        const userTokens = extractTokens(deviceTokens);

        if (userTokens?.length) {
            try {
                await this._notificationService.SendNotificationToMultipleTokens({
                    tokens: userTokens,
                    title: 'Email Address Updated',
                    body: `Your email address has been updated to ${normalizedEmail}.`,
                    notificationData: {
                        orderId: '',
                        key: 'PROFILE_UPDATE',
                        route: '',
                    },
                });
            } catch (error) {
                console.log('Error sending email change notification:', error);
            }
        }

        return {
            data: {
                userId: userId,
                oldEmail: user.email,
                newEmail: normalizedEmail,
                changedAt: changeLog.createdAt,
            },
            message: 'Email updated successfully',
        };
    }
}
