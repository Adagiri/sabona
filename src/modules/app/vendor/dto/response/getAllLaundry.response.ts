import { ApiProperty } from '@nestjs/swagger';

class LaundryDTO {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  address: string;
}

export class GetAllLaundriesResponseDTO {
  @ApiProperty({ type: [LaundryDTO], description: 'Array of data objects' })
  data: LaundryDTO[];
}
