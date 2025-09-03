import { ApiProperty } from '@nestjs/swagger';

export class UpdateLocationResponseDTO {
    @ApiProperty()
    success: boolean;

    @ApiProperty()
    message: string;
}
