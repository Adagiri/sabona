import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

class AddTipResponse {
    @ApiProperty()
    @IsString()
    transactionId: string;
}

export class AddTipResponseDto {
    @ApiProperty({type: AddTipResponse})
    data: AddTipResponse;
}