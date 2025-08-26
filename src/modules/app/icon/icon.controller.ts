import { Body, Param, Query } from '@nestjs/common';
import { ApiController, Get, Post, Patch, Delete, Authorized } from '../../../core/decorators';
import { UserType } from '@prisma/client';
import IconService from './icon.service';
import { CreateIconRequestDTO, UpdateIconRequestDTO } from './dto/request/icon.request';
import { IconResponseDTO, GetAllIconsResponseDTO, IconMessageResponseDTO } from './dto/response/icon.response';

@ApiController({
    path: '/icon',
    tag: 'icons',
    version: '1',
})
export default class IconController {
    constructor(private _iconService: IconService) {}

    @Authorized(UserType.ADMIN)
    @Post({
        path: '/create',
        description: 'Create a new icon',
        response: IconResponseDTO,
    })
    async createIcon(@Body() data: CreateIconRequestDTO): Promise<IconResponseDTO> {
        return await this._iconService.createIcon(data);
    }

    @Get({
        path: '/all',
        description: 'Get all icons with optional type filter',
        response: GetAllIconsResponseDTO,
    })
    async getAllIcons(@Query('type') type?: 'SERVICE' | 'CATEGORY' | 'GENERAL'): Promise<GetAllIconsResponseDTO> {
        return await this._iconService.getAllIcons(type);
    }

    @Get({
        path: '/:iconId',
        description: 'Get icon by ID',
        response: IconResponseDTO,
    })
    async getIconById(@Param('iconId') iconId: string): Promise<IconResponseDTO> {
        return await this._iconService.getIconById(parseInt(iconId));
    }

    @Authorized(UserType.ADMIN)
    @Patch({
        path: '/:iconId/edit',
        description: 'Update an icon',
        response: IconMessageResponseDTO,
    })
    async updateIcon(
        @Param('iconId') iconId: string,
        @Body() data: UpdateIconRequestDTO,
    ): Promise<IconMessageResponseDTO> {
        return await this._iconService.updateIcon(parseInt(iconId), data);
    }

    @Authorized(UserType.ADMIN)
    @Delete({
        path: '/:iconId/delete',
        description: 'Delete an icon',
        response: IconMessageResponseDTO,
    })
    async deleteIcon(@Param('iconId') iconId: string): Promise<IconMessageResponseDTO> {
        return await this._iconService.deleteIcon(parseInt(iconId));
    }
}
