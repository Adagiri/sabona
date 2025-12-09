import { ApiProperty } from '@nestjs/swagger';

export default class AdminBroadcastNotificationResponseDTO {
    @ApiProperty()
    message: string;

    @ApiProperty()
    totalRecipients: number;

    @ApiProperty()
    notificationsSent: number;
}
