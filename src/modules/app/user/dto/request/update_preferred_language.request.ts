import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';

export default class UpdatePreferredLanguageRequestDTO {
    @ApiProperty({
        description: 'User preferred language for notifications',
        enum: ['en', 'ar'],
        example: 'en',
    })
    @IsString()
    @IsIn(['en', 'ar'], { message: 'Language must be either "en" or "ar"' })
    preferredLanguage: string;
}
