import { ApiProperty } from '@nestjs/swagger';
import { UserStatus, UserType } from '@prisma/client';
import { UserSettingsModel } from '../../user_settings/dto/response/model_user_settings';

export default class GetMeResponseDTO {
    @ApiProperty()
    id: string;

    @ApiProperty()
    firstName: string;

    @ApiProperty()
    lastName: string;

    @ApiProperty({ enum: UserType })
    type: UserType;

    @ApiProperty()
    email: string;

    @ApiProperty()
    phone: string;

    @ApiProperty({ enum: UserStatus })
    status: UserStatus;

    @ApiProperty()
    profilePictureId: number;

    @ApiProperty()
    settings?: UserSettingsModel;
}
