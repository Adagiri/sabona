import { ApiProperty } from '@nestjs/swagger';

export class UserSettingsModel {
    @ApiProperty()
    id: number;

    @ApiProperty()
    userId: number;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;

    @ApiProperty()
    deletedAt: Date;

    @ApiProperty()
    latitude: number;

    @ApiProperty()
    longitude: number;
}
