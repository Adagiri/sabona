import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean } from "class-validator";

export class HasTippedResponseDTO {
    @ApiProperty()
    @IsBoolean()
    hasTipped: boolean;

}