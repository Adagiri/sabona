import { Injectable, NotFoundException } from '@nestjs/common';
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
        // Verify device exists and belongs to user
        const device = await this._dbService.device.findFirst({
            where: {
                id: data.deviceId,
                userId: user.id,
                deletedAt: null,
            },
        });

        if (!device) {
            throw new NotFoundException('Device not found or does not belong to user');
        }

        // Use upsert to handle updates atomically
        await this._dbService.deviceToken.upsert({
            where: {
                userId_deviceId: {
                    userId: user.id,
                    deviceId: data.deviceId,
                },
            },
            update: {
                token: data.token,
                deletedAt: null, // Restore if soft-deleted
            },
            create: {
                userId: user.id,
                deviceId: data.deviceId,
                token: data.token,
            },
        });

        return { message: 'Token added successfully' };
    }

    async RemoveUserTokens(user: User): Promise<CreateFCMTokenResponseDTO> {
        await this._dbService.deviceToken.deleteMany({
            where: { userId: user.id },
        });

        return { message: 'Tokens removed successfully' };
    }

    async RemoveDeviceToken(user: User, deviceId: number): Promise<CreateFCMTokenResponseDTO> {
        console.log(user.id, deviceId)
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
