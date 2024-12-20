import { ApiProperty } from '@nestjs/swagger';

export default class ApplicationApproveMessageResponseDTO {
  @ApiProperty()
  message: string;
}
