import { ApiProperty } from "@nestjs/swagger";

export class DeleteMediaResponseDto {
    @ApiProperty()
    message: string;
}