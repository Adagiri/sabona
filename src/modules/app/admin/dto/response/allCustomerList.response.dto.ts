
import { ApiProperty } from '@nestjs/swagger';
import { UserStatus, UserType } from '@prisma/client';

class User {
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


}

export class AllUserListDto {
    @ApiProperty({ type: [User] })
    data: User[];
}