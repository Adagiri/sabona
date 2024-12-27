import { ApiProperty } from '@nestjs/swagger';
import { DeviceType } from '@prisma/client';

export class SendMultipleNotificationResponseDTO {
    responses: FCMResponse[];
    successCount: number;
    failureCount: number;
}

class FCMResponse {
    success: boolean;
    messageId: string;
}


export class SendNotificationResponseDTO {
    @ApiProperty()
    message: string;
}   
