import { Body, Param } from '@nestjs/common';
import NotificationService from './notification.service';
import { ApiController, Authorized, Get, Post } from '../../../core/decorators';
import SendNotificationRequestDTO, { MultipleDeviceNotificationDto } from './dto/request/notification.request';
import { SendMultipleNotificationResponseDTO, SendNotificationResponseDTO } from './dto/response/notification.response';

@ApiController({ version: '1', tag: 'notification' })

export default class NotificationController {
    constructor(private _notificationService: NotificationService) { }

    // @Authorized()
    @Post({
        path: '/notification/send',
        description: 'Send a notification to a single device',
        response: SendNotificationResponseDTO,
    })
    async SendNotification(
        @Body() body: SendNotificationRequestDTO,
    ): Promise<SendNotificationResponseDTO> {
        return await this._notificationService.SendNotification(body);
    }


    // @Authorized()
    @Post({
        path: '/notification/send-multiple',
        description: 'Send notifications to multiple devices',
        response: SendMultipleNotificationResponseDTO,
    })
    async SendMultipleNotifications(
        @Body() data: MultipleDeviceNotificationDto
    ): Promise<SendMultipleNotificationResponseDTO> {
        return await this._notificationService.SendNotificationToMultipleTokens(data);
    }

}
