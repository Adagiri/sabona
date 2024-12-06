import { ApiProperty } from '@nestjs/swagger';

export default class LaundryServiceMessageResponseDTO {
  @ApiProperty()
  message: string;
}
