import { ApiProperty } from '@nestjs/swagger';

class NearbyLaundry {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    address: string;

    @ApiProperty()
    lat: number;

    @ApiProperty()
    long: number;
}

export class ValidateCustomLocationResponseDTO {
    @ApiProperty({ description: 'Whether the location is valid' })
    isValid: boolean;

    @ApiProperty({ type: [NearbyLaundry], description: 'Nearby registered laundries' })
    nearbyLaundries: NearbyLaundry[];

    @ApiProperty({ type: [String], description: 'Validation warnings' })
    warnings: string[];
}
