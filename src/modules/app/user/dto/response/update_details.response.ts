import { ApiProperty } from '@nestjs/swagger';
import { UserType } from '@prisma/client';

export default class UpdateUserDetailsResponseDTO {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    firstName: string;

    @ApiProperty()
    lastName: string;

    @ApiProperty()
    email: string;

    @ApiProperty()
    phone: string;

    @ApiProperty({ enum: UserType })
    type: UserType;

    @ApiProperty()
    status: string;

    @ApiProperty()
    profilePictureId: number;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;

    @ApiProperty()
    deletedAt: Date;
}
