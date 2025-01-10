import { ApiProperty } from "@nestjs/swagger";

export class MarkNotificationsReadResponseDTO {
  @ApiProperty()
  message: string;
}
