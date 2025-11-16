import { ApiProperty } from '@nestjs/swagger';

export class ReorderResponseDTO {
    @ApiProperty()
    success: boolean;

    @ApiProperty()
    message: string;
}
