import { Injectable } from '@nestjs/common';
import DatabaseService from '../../../database/database.service';
import { GenerateUUID } from '../../../helpers/util.helper';
import CreateDeviceRequestDTO from './dto/request/create.request';
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
        data: { token: string },
        user: User
    ): Promise<CreateFCMTokenResponseDTO> {
        // Fetch all FCM tokens for the user
        // const userFcmTokens = await this._dbService.deviceToken.findMany({
        //     where: { userId: user.id },
        // });
        const alreadyExist = await this._dbService.deviceToken.findFirst({
            where: {
                AND: {
                    token: data.token,
                    userId: user.id
                }
            }
        })


        if (alreadyExist) {
            return { message: 'Token already exists' };
        }

        // Create a new FCM token
        try {
            await this._dbService.deviceToken.create({
                data: {
                    token: data.token,
                    userId: user.id,
                },
            });

            return { message: 'FCM token added successfully' };
        } catch (error) {
            console.error('Failed to add FCM token:', error);
            throw new Error('An error occurred while adding the FCM token');
        }
    }


    async FindById(id: number): Promise<CreateDeviceResponseDTO> {
        return await this._dbService.device.findFirst({ where: { id } });
    }

    async FindByUUID(uuid: string): Promise<CreateDeviceResponseDTO> {
        return await this._dbService.device.findFirst({ where: { uuid } });
    }
}
