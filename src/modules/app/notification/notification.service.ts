import { Injectable, Query } from '@nestjs/common';
import SendNotificationRequestDTO, { MultipleDeviceNotificationDto } from './dto/request/notification.request';
import { SendMultipleNotificationResponseDTO, SendNotificationResponseDTO } from './dto/response/notification.response';
import FirebaseService from '../../../modules/firebase/firebase.service';
import { NotificationStatus, NotificationType, User, UserStatus, Prisma } from '@prisma/client';
import { GetOrderOptions, GetPaginationOptions } from '../../../helpers/util.helper';
import PaginatedRequest from '../../../core/request/paginated.request';
import DatabaseService from '../../../database/database.service';
import { GetNotificationResponseDTO } from './dto/response/getNotifications.response';
import MarkReadNotificationReadRequestDTO from './dto/request/readnotification.request';
import { BadRequestException } from '../../../core/exceptions/response.exception';
import { getNotificationContent, NOTIFICATION_TEMPLATES } from './notification.templates';
import AdminBroadcastNotificationRequestDTO from './dto/request/admin_broadcast.request';
import AdminBroadcastNotificationResponseDTO from './dto/response/admin_broadcast.response';

@Injectable()
export default class NotificationService {
    constructor(
        private _firebaseService: FirebaseService,
        private _dbService: DatabaseService,
    ) {}

    async GetNotifications(@Query() data: PaginatedRequest, user: User): Promise<GetNotificationResponseDTO> {
        const pagination = GetPaginationOptions(data);
        const order = GetOrderOptions(data);

        // Fetch notifications with filtering, pagination, and ordering
        const notification = await this._dbService.notification.findMany({
            select: {
                id: true,
                type: true,
                message: true,
                createdAt: true,
                status: true,
                data: true,
            },
            where: {
                userId: user.id,
            },
            ...pagination,
            orderBy: order,
        });

        return { data: notification };
    }

    async MarkNotificationsRead(params: MarkReadNotificationReadRequestDTO): Promise<any> {
        const notification = await this._dbService.notification.update({
            where: {
                id: params.id,
            },
            data: {
                status: NotificationStatus.READ,
            },
        });

        if (!notification) {
            throw new BadRequestException('common.errors.fatal'); // Already exists
        }

        return { message: 'notification.marked_read' };
    }

    async SendNotification(data: SendNotificationRequestDTO): Promise<SendNotificationResponseDTO> {
        const { token, title, body } = data;
        return this._firebaseService.SendNotificationOneSingleDevice({ token, title, body });
    }

    async SendNotificationToMultipleTokens(
        data: MultipleDeviceNotificationDto,
    ): Promise<SendMultipleNotificationResponseDTO> {
        return this._firebaseService.SendNotificationToMultipleTokens(data);
    }

    /**
     * Send multilingual notification to a single user
     */
    async SendMultilingualNotificationToUser(
        userId: string,
        templateKey: keyof typeof NOTIFICATION_TEMPLATES,
        notificationData?: { orderId?: string; key?: string; route?: string },
        customData?: { title?: string; body?: string; customerName?: string; orderNumber?: string },
    ): Promise<void> {
        // Get user's device tokens and preferred language
        const user = await this._dbService.user.findUnique({
            where: { id: userId },
            select: {
                preferredLanguage: true,
                DeviceToken: {
                    where: { deletedAt: null },
                    select: { token: true },
                },
            },
        });

        if (!user || !user.DeviceToken || user.DeviceToken.length === 0) {
            return; // No device tokens, skip notification
        }

        const tokens = user.DeviceToken.map((dt) => dt.token);
        const lang = user.preferredLanguage || 'en';

        // Get notification content in user's preferred language
        const { title, body } = getNotificationContent(templateKey, lang, customData);

        // Send push notification
        await this._firebaseService.SendNotificationToMultipleTokens({
            tokens,
            title,
            body,
            notificationData,
        });
    }

    /**
     * Send multilingual notifications to multiple users (handles different language preferences)
     */
    async SendMultilingualNotificationToMultipleUsers(
        userIds: string[],
        templateKey: keyof typeof NOTIFICATION_TEMPLATES,
        notificationData?: { orderId?: string; key?: string; route?: string },
        customData?: { title?: string; body?: string },
    ): Promise<void> {
        // Get all users with their device tokens and language preferences
        const users = await this._dbService.user.findMany({
            where: { id: { in: userIds } },
            select: {
                id: true,
                preferredLanguage: true,
                DeviceToken: {
                    where: { deletedAt: null },
                    select: { token: true },
                },
            },
        });

        // Group tokens by language
        const tokensByLanguage: Record<string, string[]> = {};

        users.forEach((user) => {
            if (!user.DeviceToken || user.DeviceToken.length === 0) return;

            const lang = user.preferredLanguage || 'en';
            if (!tokensByLanguage[lang]) {
                tokensByLanguage[lang] = [];
            }

            const userTokens = user.DeviceToken.map((dt) => dt.token);
            tokensByLanguage[lang].push(...userTokens);
        });

        // Send notifications for each language group
        for (const [lang, tokens] of Object.entries(tokensByLanguage)) {
            if (tokens.length === 0) continue;

            const { title, body } = getNotificationContent(templateKey, lang, customData);

            await this._firebaseService.SendNotificationToMultipleTokens({
                tokens,
                title,
                body,
                notificationData,
            });
        }
    }

    /**
     * Create in-app notification record
     */
    async CreateInAppNotification(
        userId: string,
        type: NotificationType,
        message: string,
        orderId?: string,
        data?: any,
    ): Promise<void> {
        await this._dbService.notification.create({
            data: {
                userId,
                type,
                message,
                orderId,
                status: NotificationStatus.UNREAD,
                data: data || {},
            },
        });
    }

    /**
     * Create in-app notifications for multiple users
     */
    async CreateInAppNotificationsForMultipleUsers(
        userIds: string[],
        type: NotificationType,
        message: string,
        orderId?: string,
        data?: any,
    ): Promise<void> {
        await this._dbService.notification.createMany({
            data: userIds.map((userId) => ({
                userId,
                type,
                message,
                orderId,
                status: NotificationStatus.UNREAD,
                data: data || {},
            })),
        });
    }

    /**
     * Admin broadcast notification with filters
     */
    async SendAdminBroadcastNotification(
        data: AdminBroadcastNotificationRequestDTO,
    ): Promise<AdminBroadcastNotificationResponseDTO> {
        try {
            // Build filter conditions
            const whereConditions: Prisma.UserWhereInput = {
                status: UserStatus.ACTIVE, // Only active users
                deletedAt: null,
            };

            // Filter by user types
            if (data.userTypes && data.userTypes.length > 0) {
                whereConditions.type = { in: data.userTypes };
            }

            // Filter by registration date
            if (data.registrationStartDate || data.registrationEndDate) {
                whereConditions.createdAt = {};
                if (data.registrationStartDate) {
                    whereConditions.createdAt.gte = new Date(data.registrationStartDate);
                }
                if (data.registrationEndDate) {
                    whereConditions.createdAt.lte = new Date(data.registrationEndDate);
                }
            }
            console.log(whereConditions);
            // Get all users matching the filters
            let users = await this._dbService.user.findMany({
                where: whereConditions,
                select: {
                    id: true,
                    preferredLanguage: true,
                    DeviceToken: {
                        where: { deletedAt: null },
                        select: { token: true },
                    },
                    _count: {
                        select: { Order: true },
                    },
                },
            });

            console.log(users.length, 'user length');

            // Filter by order count if specified
            if (data.minOrderCount !== undefined || data.maxOrderCount !== undefined) {
                console.log(1);
                users = users.filter((user) => {
                    const orderCount = user._count.Order;
                    if (data.minOrderCount !== undefined && orderCount < data.minOrderCount) {
                        return false;
                    }
                    if (data.maxOrderCount !== undefined && orderCount > data.maxOrderCount) {
                        return false;
                    }
                    return true;
                });
            }

            // Filter out users without device tokens
            const usersWithTokens = users.filter((user) => user.DeviceToken && user.DeviceToken.length > 0);
            console.log(usersWithTokens.length, 'user with token count');
            if (usersWithTokens.length === 0) {
                return {
                    message: 'No users found matching the specified filters',
                    totalRecipients: 0,
                    notificationsSent: 0,
                };
            }

            // Group tokens by language
            const tokensByLanguage: Record<string, string[]> = {};

            usersWithTokens.forEach((user) => {
                const lang = user.preferredLanguage || 'en';
                if (!tokensByLanguage[lang]) {
                    tokensByLanguage[lang] = [];
                }

                const userTokens = user.DeviceToken.map((dt) => dt.token);
                tokensByLanguage[lang].push(...userTokens);
            });

            console.log(usersWithTokens, 'user with tokens');
            let notificationsSent = 0;

            // Send notifications for each language group
            for (const [lang, tokens] of Object.entries(tokensByLanguage)) {
                if (tokens.length === 0) continue;

                const title = lang === 'ar' ? data.titleAr : data.titleEn;
                const body = lang === 'ar' ? data.bodyAr : data.bodyEn;

                await this._firebaseService.SendNotificationToMultipleTokens({
                    tokens,
                    title,
                    body,
                    notificationData: {
                        key: data.actionType || 'GENERAL',
                        route: data.route || 'Home',
                    },
                });

                notificationsSent += tokens.length;
            }

            return {
                message: 'Broadcast notification sent successfully',
                totalRecipients: usersWithTokens.length,
                notificationsSent,
            };
        } catch (error) {
            throw new BadRequestException(`Failed to send broadcast notification: ${error.message}`);
        }
    }
}
