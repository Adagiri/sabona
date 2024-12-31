import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean } from "class-validator";

export class isUserExistResponseDTO {
  @ApiProperty()
  @IsBoolean()
  isExist: boolean;
}
