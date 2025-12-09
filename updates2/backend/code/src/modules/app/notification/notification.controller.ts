import { Body, Param, Query } from '@nestjs/common';
import NotificationService from './notification.service';
import { ApiController, Authorized, CurrentUser, Get, Patch, Post } from '../../../core/decorators';
import SendNotificationRequestDTO, { MultipleDeviceNotificationDto } from './dto/request/notification.request';
import { SendMultipleNotificationResponseDTO, SendNotificationResponseDTO } from './dto/response/notification.response';
import { User, UserType } from '@prisma/client';
import PaginatedRequest from 'src/core/request/paginated.request';
import { GetNotificationResponseDTO } from './dto/response/getNotifications.response';
// import UpdateUserDetailsRequestDTO from '../user/dto/request/update_details.request';
import ReadNotificationRequestDTO from './dto/request/readnotification.request';
import { MarkNotificationsReadResponseDTO } from './dto/response/readNotificaiton.response';
import AdminBroadcastNotificationRequestDTO from './dto/request/admin_broadcast.request';
import AdminBroadcastNotificationResponseDTO from './dto/response/admin_broadcast.response';

@ApiController({ version: '1', tag: 'notification' })
export default class NotificationController {
    constructor(private _notificationService: NotificationService) {}

    @Authorized()
    @Get({
        path: '/notification/me',
        description: 'Get current user notifications',
        response: GetNotificationResponseDTO,
    })
    GetMe(@Query() data: PaginatedRequest, @CurrentUser() user: User): Promise<GetNotificationResponseDTO> {
        return this._notificationService.GetNotifications(data, user);
    }

    @Authorized()
    @Patch({
        path: '/notification/:id',
        description: 'Mark notification as read',
        response: MarkNotificationsReadResponseDTO,
    })
    MarkNotificationsRead(@Param() params: ReadNotificationRequestDTO): Promise<MarkNotificationsReadResponseDTO> {
        return this._notificationService.MarkNotificationsRead(params);
    }

    // @Authorized()
    @Post({
        path: '/notification/send',
        description: 'Send a notification to a single device',
        response: SendNotificationResponseDTO,
    })
    async SendNotification(@Body() body: SendNotificationRequestDTO): Promise<SendNotificationResponseDTO> {
        return await this._notificationService.SendNotification(body);
    }

    // @Authorized()
    @Post({
        path: '/notification/send-multiple',
        description: 'Send notifications to multiple devices',
        response: SendMultipleNotificationResponseDTO,
    })
    async SendMultipleNotifications(
        @Body() data: MultipleDeviceNotificationDto,
    ): Promise<SendMultipleNotificationResponseDTO> {
        return await this._notificationService.SendNotificationToMultipleTokens(data);
    }

    @Authorized(UserType.ADMIN)
    @Post({
        path: '/notification/admin/broadcast',
        description: 'Send broadcast notification to filtered users (Admin only)',
        response: AdminBroadcastNotificationResponseDTO,
    })
    async SendAdminBroadcast(
        @Body() data: AdminBroadcastNotificationRequestDTO,
    ): Promise<AdminBroadcastNotificationResponseDTO> {
        return await this._notificationService.SendAdminBroadcastNotification(data);
    }
}
