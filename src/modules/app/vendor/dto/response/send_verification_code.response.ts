import { ApiProperty } from "@nestjs/swagger";

export class SendVerificationCodeResponseDTO {
  @ApiProperty()
  message: string;
}
