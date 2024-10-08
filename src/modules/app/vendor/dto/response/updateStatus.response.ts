import { ApiProperty } from "@nestjs/swagger";

export default class UpdateStatusResponseDTO {
    @ApiProperty()
    message: string;
}