import { Body, Param } from '@nestjs/common';
import { User } from '@prisma/client';
import { ApiController, Authorized, CurrentUser, Delete, Post } from '../../../core/decorators';
import {
    UploadFinalizeAdminMediaRequestDTO,
    UploadFinalizeMediaRequestDTO,
    UploadInitiateAdminMediaRequestDTO,
    UploadInitiateMediaRequestDTO,
} from './dto/request/upload.request';
import {
    UploadFinalizeMediaResponseDTO,
    UploadInitiateMediaResponseDTO,
} from './dto/response/upload.response';
import MediaService from './media.service';
import { DeleteMediaResponseDto } from './dto/response/deleteMedia.response';

@ApiController({
    path: '/media',
    tag: 'media',
    version: '1',
})
export default class MediaController {
    constructor(private _mediaService: MediaService) {}

    @Post({
        path: '/public/init',
        description: 'Upload public media',
        response: UploadInitiateMediaResponseDTO,
    })
    UploadPublicInitiate(
        @Body() data: UploadInitiateMediaRequestDTO,
    ): Promise<UploadInitiateMediaResponseDTO> {
        return this._mediaService.UploadInitiate(data);
    }

    @Post({
        path: '/application/init',
        description: 'Upload public media application',
        response: UploadInitiateMediaResponseDTO,
    })
    UploadAdminInitiate(
        @Body() data: UploadInitiateAdminMediaRequestDTO,
    ): Promise<UploadInitiateMediaResponseDTO> {
        return this._mediaService.UploadAdminInitiate(data);
    }

    @Post({
        path: '/application/finalize',
        description: 'Finalize public media',
        response: UploadFinalizeMediaResponseDTO,
    })
    UploadAdminFinalize(
        @Body() data: UploadFinalizeAdminMediaRequestDTO,
    ): Promise<UploadFinalizeMediaResponseDTO> {
        return this._mediaService.UploadAdminFinalize(data);
    }

    @Post({
        path: '/public/finalize',
        description: 'Finalize public media',
        response: UploadFinalizeMediaResponseDTO,
    })
    UploadPublicFinalize(
        @Body() data: UploadFinalizeMediaRequestDTO,
    ): Promise<UploadFinalizeMediaResponseDTO> {
        return this._mediaService.UploadFinalize(data);
    }

    @Authorized()
    @Post({
        path: '/init',
        description: 'Upload media',
        response: UploadInitiateMediaResponseDTO,
    })
    UploadInitiate(
        @Body() data: UploadInitiateMediaRequestDTO,
        @CurrentUser() user: User,
    ): Promise<UploadInitiateMediaResponseDTO> {
        return this._mediaService.UploadInitiate(data, user);
    }

    @Authorized()
    @Post({
        path: '/finalize',
        description: 'Finalize media',
        response: UploadFinalizeMediaResponseDTO,
    })
    UploadFinalize(
        @Body() data: UploadFinalizeMediaRequestDTO,
        @CurrentUser() user: User,
    ): Promise<UploadFinalizeMediaResponseDTO> {
        return this._mediaService.UploadFinalize(data, user);
    }

    @Authorized()
    @Delete({
        path: '/:mediaId',
        description: 'Delete Media',
        response: DeleteMediaResponseDto
    })
    async DeleteMedia(
        @Param('mediaId') mediaId: number
        ): Promise<DeleteMediaResponseDto> {
        return await this._mediaService.DeleteMedia(mediaId)
    }


    @Authorized()
    @Post({
        path: '/getSignedUrl/:location',
        description: 'Get signed url',
        response: DeleteMediaResponseDto
    })
    async GetSignedUrl(
        @Param('location') location: string
    ): Promise<DeleteMediaResponseDto> {
        return this._mediaService.GetSignedUrl(location);
    }
}
