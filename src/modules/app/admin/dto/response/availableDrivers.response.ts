import { ApiProperty } from '@nestjs/swagger';

class AvailableDriver {
    @ApiProperty()
    riderId: string;

    @ApiProperty()
    firstName: string;

    @ApiProperty()
    lastName: string;

    @ApiProperty()
    phone: string;

    @ApiProperty({ description: 'Distance from pickup location in km' })
    distance: number;

    @ApiProperty()
    isAvailable: boolean;
}

export class GetAvailableDriversResponseDTO {
    @ApiProperty({ type: [AvailableDriver] })
    data: AvailableDriver[];
}
