import { ApiPropertyOptional } from '@nestjs/swagger';
import { ValidateIf } from 'class-validator';

export class UpdateUserSettingsRequestDTO {
    @ApiPropertyOptional()
    @ValidateIf((o) => o.latitude !== undefined)
    latitude?: number;

    @ApiPropertyOptional()
    @ValidateIf((o) => o.longitude !== undefined)
    longitude?: number;
    
    @ApiPropertyOptional()
    @ValidateIf((o) => o.isOnboardingCompleted !== undefined)
    isOnboardingCompleted?: boolean;
}
