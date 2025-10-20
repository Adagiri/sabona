import { BadRequestException, Injectable } from '@nestjs/common';
import DatabaseService from '../../../database/database.service';
import { GenerateUUID } from '../../../helpers/util.helper';
import CreateDeviceRequestDTO, { CreateFCMTokenRequestDTO } from './dto/request/create.request';
import CreateDeviceResponseDTO, { CreateFCMTokenResponseDTO } from './dto/response/create.response';
import { User } from '@prisma/client';

@Injectable()
export default class DeviceService {
    constructor(private _dbService: DatabaseService) {}

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

    async AddFCMToken(data: CreateFCMTokenRequestDTO, user: User): Promise<CreateFCMTokenResponseDTO> {
        try {
            // Step 1: Check if this exact token already exists for this user
            const existingTokenForUser = await this._dbService.deviceToken.findFirst({
                where: {
                    token: data.token,
                    userId: user.id,
                    deletedAt: null,
                },
            });

            if (existingTokenForUser) {
                // Token already exists for this user - do nothing or update timestamp
                console.log(`Token already exists for user ${user.id}, skipping duplicate`);
                return { message: 'FCM token already registered' };
            }

            // Step 2: Check if this token exists for a DIFFERENT user
            const existingTokenForOtherUser = await this._dbService.deviceToken.findFirst({
                where: {
                    token: data.token,
                    userId: { not: user.id },
                    deletedAt: null,
                },
            });

            if (existingTokenForOtherUser) {
                // Token belongs to another user - soft delete old association
                // This handles cases where user logged out and another user logged in on same device
                console.log(`Token exists for different user, removing old association and creating new one`);

                await this._dbService.deviceToken.update({
                    where: { id: existingTokenForOtherUser.id },
                    data: { deletedAt: new Date() },
                });
            }

            // Step 3: Check if this user has an existing token with the same deviceId
            const existingDeviceToken = await this._dbService.deviceToken.findFirst({
                where: {
                    userId: user.id,
                    deviceId: data.deviceId,
                    deletedAt: null,
                },
            });

            if (existingDeviceToken && existingDeviceToken.token !== data.token) {
                // Same device but token changed - update the token
                console.log(`Updating token for device ${data.deviceId}`);

                await this._dbService.deviceToken.update({
                    where: { id: existingDeviceToken.id },
                    data: {
                        token: data.token,
                        createdAt: new Date(), // Update timestamp
                    },
                });

                return { message: 'FCM token updated successfully' };
            }

            // Step 4: Create new token entry
            await this._dbService.deviceToken.create({
                data: {
                    userId: user.id,
                    token: data.token,
                    deviceId: data.deviceId,
                },
            });

            return { message: 'FCM token added successfully' };
        } catch (error) {
            console.error('Error adding FCM token:', error);
            throw new BadRequestException('Failed to add FCM token');
        }
    }

    async RemoveUserTokens(user: User): Promise<CreateFCMTokenResponseDTO> {
        await this._dbService.deviceToken.deleteMany({
            where: { userId: user.id },
        });

        return { message: 'Tokens removed successfully' };
    }

    async RemoveDeviceToken(user: User, deviceId: number): Promise<CreateFCMTokenResponseDTO> {
        console.log(user.id, deviceId);
        await this._dbService.deviceToken.deleteMany({
            where: {
                userId: user.id,
                deviceId: deviceId,
            },
        });

        return { message: 'Token removed successfully' };
    }

    async FindById(id: number): Promise<CreateDeviceResponseDTO> {
        return await this._dbService.device.findFirst({
            where: {
                id,
                deletedAt: null,
            },
        });
    }

    async FindByUUID(uuid: string): Promise<CreateDeviceResponseDTO> {
        return await this._dbService.device.findFirst({
            where: {
                uuid,
                deletedAt: null,
            },
        });
    }
}
