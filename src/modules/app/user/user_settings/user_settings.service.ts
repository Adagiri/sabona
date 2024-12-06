import { Injectable } from '@nestjs/common';
import DatabaseService from '../../../../database/database.service';
import { BooleanResponseDTO } from '../../../../core/response/response.schema';
import { UpdateUserSettingsRequestDTO } from './dto/request/update_user_settings.request';

@Injectable()
export default class UserSettingsService {
    constructor(private _dbService: DatabaseService) {}

    async Update(userId: string, data: UpdateUserSettingsRequestDTO): Promise<BooleanResponseDTO> {
        await this._dbService.userSettings.update({
            where: {
                userId,
            },
            data: {
                lat: data.latitude || 0,
                long: data.longitude || 0,
                isOnboardingCompleted: data.isOnboardingCompleted,
            }
        });
        return {
            data: true,
        };
    }
}
