import { Injectable } from '@nestjs/common';
import DatabaseService from '../../../database/database.service';
import { AllOrderListDto } from './dto/response/allorderlist.response.dto';
import FindUsersRequestDTO from '../user/dto/request/find.request';
import FindUsersResponseDTO from '../user/dto/response/find.response';
import { CouponType, Prisma, UserStatus, UserType } from '@prisma/client';
import {
    extractTokens,
    GetDateFilterOptions,
    GetOrderOptions,
    GetPaginationOptions,
    GetSlotFilterOptions,
} from 'src/helpers/util.helper';
import FindOrderRequestDTO from './dto/request/find.request';
import FindApplicationRequestDTO from './dto/request/application.request';
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

@Injectable()
export default class AdminService {
    constructor(
        private _dbService: DatabaseService,
        private _notificationService: NotificationService,
        private _s3service: S3Service,
    ) {}

    async GetAllOrders(data: FindOrderRequestDTO): Promise<AllOrderListDto> {
        const where: Prisma.OrderWhereInput = {
            ...(!!data.type && { status: data.type }), // Only include 'status' condition if it exists
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

    async ApproveApplication(userId: string): Promise<ApplicationApproveMessageResponseDTO> {
        const user = await this._dbService.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException('User not found');
        }

        if (user.status !== UserStatus.INACTIVE) {
            throw new BadRequestException('Application is already approved');
        }

        await this._dbService.user.update({
            where: { id: userId },
            data: { status: UserStatus.ACTIVE },
        });

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

        const data = {
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
                const res = await this._notificationService.SendNotificationToMultipleTokens(data);
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
            console.log('NO TOKENS TO SEND NOTIFICAITON');
        }

        return { message: 'Application approved successfully' };
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
        const couponCodeAlreadyExists = await this._dbService.coupon.findUnique({
            where: {
                code: data.code.toUpperCase(),
            },
        });

        if (couponCodeAlreadyExists) {
            throw new BadRequestException('Coupon code already exists');
        }

        if (data.type === CouponType.FIXED && !data.minOrderAmount) {
            throw new BadRequestException('Minimum order amount is required for fixed discount coupons');
        }

        const coupon = await this._dbService.coupon.create({
            data: {
                code: data.code.toUpperCase(),
                name: data.name,
                discount: data.discount,
                type: data.type,
                startDate: data.startDate ? data.startDate : new Date(),
                maxDiscount: data.maxDiscount,
                expiryDate: data.expiryDate,
                usageLimit: data.usageLimit,
                singleUse: data.singleUse,
                minOrderAmount: data.minOrderAmount,
                isActive: data.isActive,
            },
        });

        if (!coupon) {
            throw new BadRequestException('Error creating coupon');
        }

        return coupon;
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
}
