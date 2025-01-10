import { NotificationType } from "@prisma/client";
import { JsonValue } from "@prisma/client/runtime/library";
import { ApiProperty } from "@nestjs/swagger";

class NotificationDTO {
    @ApiProperty()
    id: string;

  @ApiProperty({ enum: NotificationType })
  type: NotificationType;

  @ApiProperty()
  message: string;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Object, example: { key: 'FETCH_ORDERS', route: 'Orders', orderId: 'abc-123' } })
  data: JsonValue;
}

export class GetNotificationResponseDTO {
  @ApiProperty({ type: [NotificationDTO] })
  data: NotificationDTO[];
}
