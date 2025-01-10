import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsObject, IsString } from 'class-validator';

class LocationSettingsDTO {
    @ApiProperty()
    @IsNumber()
    lat: number;

    @ApiProperty()
    @IsNumber()
    long: number;
}

class UserLocationDTO {
    @ApiProperty()
    @IsString()
    id: string;

    @ApiProperty()
    @IsObject()
    settings: LocationSettingsDTO;
}

export class AllUserLocationsResponseDTO {
    @ApiProperty({ type: [UserLocationDTO] })
    data: UserLocationDTO[];
}
