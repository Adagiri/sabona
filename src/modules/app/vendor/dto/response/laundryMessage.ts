import { ApiProperty } from '@nestjs/swagger';

export default class LaundryMessageResponseDTO {
  @ApiProperty()
  message: string;
}
