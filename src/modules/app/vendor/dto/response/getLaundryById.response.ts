import { ApiProperty } from '@nestjs/swagger';

class LaundryServiceDTO {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;
}

class LaundryDataDTO {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  address: string;

  @ApiProperty({ type: [LaundryServiceDTO], description: 'List of laundry services' })
  laundryService: LaundryServiceDTO[];
}

export class GetLaundryByIdResponseDTO {
  @ApiProperty({ description: 'The main data payload of the response', type: LaundryDataDTO })
  data: LaundryDataDTO;
}
