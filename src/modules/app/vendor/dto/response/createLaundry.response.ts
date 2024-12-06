import { ApiProperty } from '@nestjs/swagger';

class LaundryServiceDTO {
  @ApiProperty()
  id: string;

  @ApiProperty()
  laundryId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ nullable: true })
  deletedAt: Date | null;
}

class LaundryDataDTO {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  address: string;

  @ApiProperty()
  vendorId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ nullable: true })
  deletedAt: Date | null;

  @ApiProperty({ type: [LaundryServiceDTO] })
  laundryService: LaundryServiceDTO[];
}

export class CreateLaundryReponseDTO {
  @ApiProperty({ description: 'The data payload of the response', type: LaundryDataDTO })
  data: LaundryDataDTO;
}
