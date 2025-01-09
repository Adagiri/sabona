import { ApiProperty } from "@nestjs/swagger";

export class HasFeedbackResponseDTO {
    @ApiProperty()
    hasFeedback: boolean;
}