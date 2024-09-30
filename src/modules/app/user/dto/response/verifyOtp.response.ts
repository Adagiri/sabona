import { ApiProperty } from "@nestjs/swagger";

export default class VerifyOtpResponseDTO {
    @ApiProperty({ description: 'Token' })
    token: string;
}