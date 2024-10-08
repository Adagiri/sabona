import { ApiProperty } from "@nestjs/swagger";

export default class UpdateOrderStatusResponseDTO {
    @ApiProperty()
    message: string
}