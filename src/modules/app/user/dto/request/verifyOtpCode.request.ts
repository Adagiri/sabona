import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { UserType } from "@prisma/client";
import { IsNotEmpty, IsOptional, IsString, Matches } from "class-validator";

export class VerifyOtpRequestDTO {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Matches(/^(?:00|\+)(92|966)[0-9\s.\/-]{8,12}$/, {
    message: 'Phone number must start with +92 or +966 followed by the correct format',
  })
  phone: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  otp: string;

  @ApiProperty({ enum: UserType })
  @IsString()
  type: UserType;

  @ApiProperty()
  @IsOptional()
  longitude: number;

  @ApiProperty()
  @IsOptional()
  latitude: number;

  @ApiPropertyOptional()
  @IsOptional()
  password: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  referrerId: string;
}
