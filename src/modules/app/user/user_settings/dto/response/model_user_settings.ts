import { ApiProperty } from '@nestjs/swagger';

export class UserSettingsModel {
    @ApiProperty()
    id: number;

    @ApiProperty()
    userId: string;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;

    @ApiProperty()
    deletedAt: Date;

    @ApiProperty()
    lat: number;

    @ApiProperty()
    long: number;
}
