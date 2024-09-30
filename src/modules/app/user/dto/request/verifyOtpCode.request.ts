import { ApiProperty } from "@nestjs/swagger";
import { UserType } from "@prisma/client";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class VerifyOtpRequestDTO {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  otp: string;

  @ApiProperty({ enum: UserType})
  @IsString()
  @IsOptional()
  type: UserType;

  @ApiProperty()
  @IsOptional()
  longitude: number;

  @ApiProperty()
  @IsOptional()
  latitude: number;
}
