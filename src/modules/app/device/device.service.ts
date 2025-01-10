import { Injectable } from '@nestjs/common';
import DatabaseService from '../../../database/database.service';
import { GenerateUUID } from '../../../helpers/util.helper';
import CreateDeviceRequestDTO, { CreateFCMTokenRequestDTO } from './dto/request/create.request';
import CreateDeviceResponseDTO, { CreateFCMTokenResponseDTO } from './dto/response/create.response';
import { User } from '@prisma/client';

@Injectable()
export default class DeviceService {
    constructor(private _dbService: DatabaseService) { }

    async Create(data: CreateDeviceRequestDTO): Promise<CreateDeviceResponseDTO> {
        return await this._dbService.device.create({
            data: {
                uuid: GenerateUUID(),
                type: data.type,
                userId: data.userId,
                userAgent: data.userAgent,
            },
        });
    }

    async AddFCMToken(
        data: CreateFCMTokenRequestDTO,
        user: User
    ): Promise<CreateFCMTokenResponseDTO> {
        try {
            const conflictingToken = await this._dbService.deviceToken.findFirst({
                where: {
                    deviceId: data.deviceId,
                    userId: { not: user.id }, // Token is linked to another user
                    user:{
                        type: user.type
                    }
                },
            });
    
            if (conflictingToken) {
                // Step 2: Remove the conflicting token
                await this._dbService.deviceToken.delete({
                    where: { id: conflictingToken.id },
                });
            }
    
            // Step 3: Delete existing token for the current user and device
            await this._dbService.deviceToken.deleteMany({
                where: {
                    userId: user.id,
                    deviceId: data.deviceId,
                },
            });
    
            // Step 4: Create a new token
            await this._dbService.deviceToken.create({
                data: {
                    userId: user.id,
                    deviceId: data.deviceId,
                    token: data.token,
                },
            });
    
            return { message: 'Token added successfully' };
        } catch (error) {
            console.error('Failed to process FCM token:', error);
            throw new Error('An error occurred while processing the FCM token');
        }
    }
    

    async RemoveUserTokens(user: User): Promise<CreateFCMTokenResponseDTO> {
        const res = await this._dbService.deviceToken.deleteMany({
            where: { userId: user.id },
        });

        if (res) {
            return { message: 'Tokens removed successfully' };
        }
    }

    async FindById(id: number): Promise<CreateDeviceResponseDTO> {
        return await this._dbService.device.findFirst({ where: { id } });
    }

    async FindByUUID(uuid: string): Promise<CreateDeviceResponseDTO> {
        return await this._dbService.device.findFirst({ where: { uuid } });
    }
}
