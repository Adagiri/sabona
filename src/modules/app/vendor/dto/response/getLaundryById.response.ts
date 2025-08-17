import { ApiProperty } from '@nestjs/swagger';

class IconMedia {
    @ApiProperty()
    id: number;

    @ApiProperty()
    name: string;

    @ApiProperty()
    path: string;

    @ApiProperty()
    extension: string;
}

class LaundryServiceDTO {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    description: string;

    @ApiProperty({ type: IconMedia, required: false })
    icon?: IconMedia;
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
