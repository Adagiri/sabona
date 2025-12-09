import { ApiProperty } from '@nestjs/swagger';

export default class UpdatePreferredLanguageResponseDTO {
    @ApiProperty()
    id: string;

    @ApiProperty()
    preferredLanguage: string;

    @ApiProperty()
    message: string;
}
