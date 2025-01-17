import { ApiProperty } from '@nestjs/swagger';
import { MediaStatus, UserStatus, UserType } from '@prisma/client';

export class UserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  phone: string;

  @ApiProperty({enum : UserType})
  type: UserType;

  @ApiProperty({enum : UserStatus})
  status: UserStatus;

  @ApiProperty({ type: () => [MediaDto] })
  medias: MediaDto[];
}

export class MediaDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  location: string;

  @ApiProperty({enum : MediaStatus})
  status: MediaStatus;
}
