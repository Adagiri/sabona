import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IconDTO } from 'src/modules/app/icon/dto/response/icon.response';

class LaundryServiceDTO {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    description: string;

    @ApiProperty()
    @Type(() => IconDTO)
    icon?: IconDTO;
}

class LaundryDataDTO {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    address: string;

    @ApiProperty()
    vendor: any;

    @ApiProperty({ type: [LaundryServiceDTO], description: 'List of laundry services' })
    laundryService: LaundryServiceDTO[];
}

export class GetLaundryByIdResponseDTO {
    @ApiProperty({ description: 'The main data payload of the response', type: LaundryDataDTO })
    data: LaundryDataDTO;
}
