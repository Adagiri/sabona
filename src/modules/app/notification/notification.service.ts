import { Injectable, Query } from '@nestjs/common';
import SendNotificationRequestDTO, { MultipleDeviceNotificationDto } from './dto/request/notification.request';
import { SendMultipleNotificationResponseDTO, SendNotificationResponseDTO } from './dto/response/notification.response';
import FirebaseService from '../../../modules/firebase/firebase.service';
import { NotificationStatus, User } from '@prisma/client';
import { GetOrderOptions, GetPaginationOptions } from '../../../helpers/util.helper';
import PaginatedRequest from '../../../core/request/paginated.request';
import DatabaseService from '../../../database/database.service';
import { GetNotificationResponseDTO } from './dto/response/getNotifications.response';
import MarkReadNotificationReadRequestDTO from './dto/request/readnotification.request';
import { BadRequestException } from '../../../core/exceptions/response.exception';

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
            throw new BadRequestException('errors.fatal'); // Already exists
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
}
