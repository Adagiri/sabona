import { Injectable } from '@nestjs/common';
import { BadRequestException } from '../../../core/exceptions/response.exception';
import DatabaseService from '../../../database/database.service';
import { IconResponseDTO, GetAllIconsResponseDTO, IconMessageResponseDTO } from './dto/response/icon.response';
import { CreateIconRequestDTO, UpdateIconRequestDTO } from './dto/request/icon.request';
import { IconType } from '@prisma/client';

@Injectable()
export default class IconService {
    constructor(private _dbService: DatabaseService) {}

    async createIcon(data: CreateIconRequestDTO): Promise<IconResponseDTO> {
        // Validate media exists
        const media = await this._dbService.media.findFirst({
            where: {
                id: data.mediaId,
                deletedAt: null,
            },
        });

        if (!media) {
            throw new BadRequestException('Media not found');
        }

        const icon = await this._dbService.icon.create({
            data: {
                name: data.name,
                description: data.description,
                mediaId: data.mediaId,
                type: data.type,
            },
            include: {
                media: {
                    select: {
                        id: true,
                        path: true,
                        name: true,
                    },
                },
            },
        });

        return { data: icon };
    }

    async getAllIcons(type?: IconType): Promise<GetAllIconsResponseDTO> {
        const icons = await this._dbService.icon.findMany({
            where: {
                ...(type && { type }), 
            },
            include: {
                media: {
                    select: {
                        id: true,
                        path: true,
                        name: true,
                    },
                },
                _count: {
                    select: {
                        laundryServices: true,
                        laundryCategories: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return { data: icons };
    }

    async getIconById(iconId: number): Promise<IconResponseDTO> {
        const icon = await this._dbService.icon.findFirst({
            where: {
                id: iconId,
            },
            include: {
                media: {
                    select: {
                        id: true,
                        path: true,
                        name: true,
                    },
                },
            },
        });

        if (!icon) {
            throw new BadRequestException('Icon not found');
        }

        return { data: icon };
    }

    async updateIcon(iconId: number, data: UpdateIconRequestDTO): Promise<IconMessageResponseDTO> {
        const icon = await this._dbService.icon.findFirst({
            where: {
                id: iconId,
            },
        });

        if (!icon) {
            throw new BadRequestException('Icon not found');
        }

        // Validate media if provided
        if (data.mediaId) {
            const media = await this._dbService.media.findFirst({
                where: {
                    id: data.mediaId,
                    deletedAt: null,
                },
            });

            if (!media) {
                throw new BadRequestException('Media not found');
            }
        }

        await this._dbService.icon.update({
            where: {
                id: iconId,
            },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.description !== undefined && { description: data.description }),
                ...(data.mediaId && { mediaId: data.mediaId }),
                ...(data.type && { type: data.type }),
            },
        });

        return { message: 'Icon updated successfully' };
    }

    async deleteIcon(iconId: number): Promise<IconMessageResponseDTO> {
        const icon = await this._dbService.icon.findFirst({
            where: {
                id: iconId,
            },
            include: {
                _count: {
                    select: {
                        laundryServices: true,
                        laundryCategories: true,
                    },
                },
            },
        });

        if (!icon) {
            throw new BadRequestException('Icon not found');
        }

        // Check if icon is in use
        const totalUsage = icon._count.laundryServices + icon._count.laundryCategories;
        if (totalUsage > 0) {
            throw new BadRequestException(`Cannot delete icon - it's being used by ${totalUsage} items`);
        }

        await this._dbService.icon.delete({
            where: {
                id: iconId,
            },
        });

        return { message: 'Icon deleted successfully' };
    }

    // Helper method for validating icon exists (used by other services)
    async validateIconExists(iconId: number): Promise<boolean> {
        const icon = await this._dbService.icon.findFirst({
            where: {
                id: iconId,
            },
        });

        return !!icon;
    }
}
