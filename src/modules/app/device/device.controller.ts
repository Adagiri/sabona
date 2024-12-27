import { Body } from '@nestjs/common';
import { ApiController, Authorized, CurrentUser, Post } from '../../../core/decorators';
import DeviceService from './device.service';
import CreateDeviceRequestDTO, { CreateFCMTokenRequestDTO } from './dto/request/create.request';
import CreateDeviceResponseDTO, { CreateFCMTokenResponseDTO } from './dto/response/create.response';
import { User } from '@prisma/client';

@ApiController({
    path: '/device',
    tag: 'device',
    version: '1',
})
export default class DeviceController {
    constructor(private _deviceService: DeviceService) {}

    @Post({
        path: '/',
        description: 'Create a new device',
        response: CreateDeviceResponseDTO,
    })
    Create(@Body() data: CreateDeviceRequestDTO): Promise<CreateDeviceResponseDTO> {
        return this._deviceService.Create(data);
    }

    @Authorized()
    @Post({
        path: '/fcm-token',
        description: 'Add FCM token to device',
        response: CreateFCMTokenResponseDTO,
    })
    AddFCMToken(
        @Body() data: CreateFCMTokenRequestDTO ,
        @CurrentUser() user: User
    ): Promise<CreateFCMTokenResponseDTO> {
        return this._deviceService.AddFCMToken(data , user);
    }
}
