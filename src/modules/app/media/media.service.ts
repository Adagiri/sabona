import { Injectable } from '@nestjs/common';
import { Media, MediaAccess, MediaStatus, MediaType, User } from '@prisma/client';
import AppConfig from '../../../configs/app.config';
import DatabaseService from '../../../database/database.service';
import {
    BadRequestException,
    ForbiddenException,
    NotFoundException,
} from '../../../core/exceptions/response.exception';
import {
    UploadFinalizeAdminMediaRequestDTO,
    UploadFinalizeMediaRequestDTO,
    UploadInitiateAdminMediaRequestDTO,
    UploadInitiateMediaRequestDTO,
} from './dto/request/upload.request';
import { UploadFinalizeMediaResponseDTO, UploadInitiateMediaResponseDTO } from './dto/response/upload.response';
import S3Service from './s3.service';
import { DeleteMediaResponseDto } from './dto/response/deleteMedia.response';

@Injectable()
export default class MediaService {
    constructor(
        private _dbService: DatabaseService,
        private _s3Service: S3Service,
    ) {}

    private _allowedMediaExtensions = {
        [MediaType.IMAGE]: ['png', 'jpg', 'bmp', 'jpeg', 'gif', 'svg'],
        [MediaType.VIDEO]: ['mov', 'wav', 'mp4', 'avi', 'flv', 'wav', 'mov'],
        [MediaType.DOCUMENT]: ['pdf', 'doc', 'docx', 'xls', 'xlsx'],
        [MediaType.ARCHIVE]: ['zip', 'gzip'],
        [MediaType.OTHER]: [],
    };

    private _allowedMediaSize = {
        [MediaType.IMAGE]: 20 * 1024, // 20kb
        [MediaType.VIDEO]: 5 * 1024 * 1024, // 5gb
        [MediaType.DOCUMENT]: 100 * 1024, // 100mb
        [MediaType.ARCHIVE]: 1 * 1024 * 1024, // 1gb
        [MediaType.OTHER]: 0,
    };

    private _getMediaExtension(fileName: string) {
        return fileName.slice(((fileName.lastIndexOf('.') - 1) >>> 0) + 2).toLowerCase();
    }

    async UploadAdminInitiate(
        data: UploadInitiateAdminMediaRequestDTO,
        adminId: string,
    ): Promise<UploadInitiateMediaResponseDTO> {
        const extension = this._getMediaExtension(data.name);
        if (!this._allowedMediaExtensions[data.type].includes(extension)) {
            throw new BadRequestException('media.not_supported');
        }

        const sizeAllowed = data.size <= this._allowedMediaSize[data.type];
        if (!sizeAllowed) {
            throw new BadRequestException('media.too_large');
        }

        const location = this._s3Service.CreateUniqueFilePath(data.name, data.type);
        const path = `${AppConfig.AWS.BUCKET_BASE_URL}/${location}`;

        const media = await this._dbService.media.create({
            data: {
                name: data.name,
                extension,
                location,
                path,
                thumbPath: path,
                type: data.type,
                status: MediaStatus.UPLOADING,
                access: data.public ? MediaAccess.PUBLIC : MediaAccess.PRIVATE,
                userId: data.userId === 'admin' ? adminId : data.userId,
                size: data.size,
            },
        });
        console.log(media);
        const credentials = await this._s3Service.GetFileUploadPermissions(location, media.id);

        return {
            accessKeyId: credentials.accessKeyId,
            secretAccessKey: credentials.secretAccessKey,
            sessionToken: credentials.sessionToken,
            mediaId: media.id,
            bucket: AppConfig.AWS.BUCKET,
            location,
            region: AppConfig.AWS.REGION,
        };
    }

    async UploadAdminFinalize(data: UploadFinalizeAdminMediaRequestDTO): Promise<UploadFinalizeMediaResponseDTO> {
        try {
            const media = await this._dbService.media.findFirst({
                where: { id: data.id },
            });

            if (!media) {
                throw new NotFoundException('media.not_found');
            }
            console.log(media.userId, data.userId);
            if (
                media.access === MediaAccess.PRIVATE &&
                (!data || data?.userId !== media.userId) &&
                data.userId !== 'admin'
            ) {
                throw new ForbiddenException('media.not_allowed');
            }

            const s3Object = await this._s3Service.GetObjectHead(media.location);
            if (!s3Object) {
                throw new NotFoundException('media.not_found');
            }

            const sizeAllowed = s3Object.contentLength <= this._allowedMediaSize[media.type];
            if (!sizeAllowed) {
                await this._dbService.media.update({
                    where: { id: media.id },
                    data: { status: MediaStatus.STALE },
                });

                await this._s3Service.UpdateObjectStaleTag(media.location);
                throw new BadRequestException('media.too_large');
            }

            if (media.access === MediaAccess.PUBLIC) {
                try {
                    await this._s3Service.UpdateObjectAccess(media.location, 'public-read');
                } catch (e) {
                    console.log('SADASDASD', e);
                }
            }

            await this._dbService.media.update({
                where: { id: media.id },
                data: {
                    status: MediaStatus.READY,
                    meta: {
                        ...(!!s3Object.duration && { duration: s3Object.duration }),
                    },
                },
            });
            media.status = MediaStatus.READY;

            await this._s3Service.UpdateObjectIdTag(media.location, media.id);

            return media;
        } catch (error) {
            console.log(error, 'error');
        }
    }

    async UploadInitiate(data: UploadInitiateMediaRequestDTO, user?: User): Promise<UploadInitiateMediaResponseDTO> {
        const extension = this._getMediaExtension(data.name);
        if (!this._allowedMediaExtensions[data.type].includes(extension)) {
            throw new BadRequestException('media.not_supported');
        }

        const sizeAllowed = data.size <= this._allowedMediaSize[data.type];
        if (!sizeAllowed) {
            throw new BadRequestException('media.too_large');
        }

        const location = this._s3Service.CreateUniqueFilePath(data.name, data.type);
        const path = `${AppConfig.AWS.BUCKET_BASE_URL}/${location}`;

        const media = await this._dbService.media.create({
            data: {
                name: data.name,
                extension,
                location,
                path,
                thumbPath: path,
                type: data.type,
                status: MediaStatus.UPLOADING,
                access: data.public ? MediaAccess.PUBLIC : MediaAccess.PRIVATE,
                userId: user ? user.id : null,
                size: data.size,
            },
        });

        const credentials = await this._s3Service.GetFileUploadPermissions(location, media.id);

        return {
            accessKeyId: credentials.accessKeyId,
            secretAccessKey: credentials.secretAccessKey,
            sessionToken: credentials.sessionToken,
            mediaId: media.id,
            bucket: AppConfig.AWS.BUCKET,
            location,
            region: AppConfig.AWS.REGION,
        };
    }

    async UploadFinalize(data: UploadFinalizeMediaRequestDTO, user?: User): Promise<UploadFinalizeMediaResponseDTO> {
        const media = await this._dbService.media.findFirst({
            where: { id: data.id },
        });
        if (!media) {
            throw new NotFoundException('media.not_found');
        }

        if (media.access === MediaAccess.PRIVATE && (!user || user.id !== media.userId)) {
            throw new ForbiddenException('media.not_allowed');
        }

        const s3Object = await this._s3Service.GetObjectHead(media.location);
        if (!s3Object) {
            throw new NotFoundException('media.not_found');
        }

        const sizeAllowed = s3Object.contentLength <= this._allowedMediaSize[media.type];
        if (!sizeAllowed) {
            await this._dbService.media.update({
                where: { id: media.id },
                data: { status: MediaStatus.STALE },
            });
            await this._s3Service.UpdateObjectStaleTag(media.location);
            throw new BadRequestException('media.too_large');
        }

        if (media.access === MediaAccess.PUBLIC) {
            await this._s3Service.UpdateObjectAccess(media.location, 'public-read');
        }

        await this._dbService.media.update({
            where: { id: media.id },
            data: {
                status: MediaStatus.READY,
                meta: {
                    ...(!!s3Object.duration && { duration: s3Object.duration }),
                },
            },
        });
        media.status = MediaStatus.READY;

        await this._s3Service.UpdateObjectIdTag(media.location, media.id);

        return media;
    }

    async GetSignedUrl(location: string): Promise<DeleteMediaResponseDto> {
        try {
            const url = await this._s3Service.GetSignedUrl(location);
            return {
                message: url,
            };
        } catch (e) {
            console.log(e);
            throw new NotFoundException('media.not_found');
        }
    }

    async DeleteMedia(mediaId: number): Promise<DeleteMediaResponseDto> {
        const mediaid = Number(mediaId);

        const media = await this._dbService.media.findFirst({
            where: { id: mediaid },
        });

        if (!media) {
            throw new NotFoundException('media.not_found');
        }

        const res = await this._dbService.media.delete({
            where: { id: mediaid },
        });

        if (res) {
            return { message: 'Media deleted successfully' };
        }
    }

    /**
     * Upload Excel report buffer to S3
     * This bypasses the normal init/finalize flow since we're uploading from backend
     */
    async UploadReportToS3(buffer: Buffer, fileName: string, type: MediaType = 'DOCUMENT'): Promise<Media> {
        const extension = '.xlsx';

        // Create unique file path
        const location = this._s3Service.CreateUniqueFilePath(fileName, type);
        const path = `${AppConfig.AWS.BUCKET_BASE_URL}/${location}`;

        // Create media record
        const media = await this._dbService.media.create({
            data: {
                name: fileName,
                extension,
                location,
                path,
                thumbPath: path,
                type,
                status: MediaStatus.UPLOADING,
                access: MediaAccess.PRIVATE, // Reports are private
                userId: null, // System-generated
                size: buffer.length / 1024, // KB
            },
        });

        try {
            // Upload directly to S3
            await this._s3Service.UploadBuffer(
                location,
                buffer,
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            );

            // Update status to READY
            await this._dbService.media.update({
                where: { id: media.id },
                data: { status: MediaStatus.READY },
            });

            // Update S3 tags
            await this._s3Service.UpdateObjectIdTag(location, media.id);

            return media;
        } catch (error) {
            // Mark as STALE if upload fails
            await this._dbService.media.update({
                where: { id: media.id },
                data: { status: MediaStatus.STALE },
            });
            throw error;
        }
    }

    /**
     * Get Excel report from S3 by media ID
     */
    async GetReportFromS3(mediaId: number): Promise<Buffer> {
        const media = await this._dbService.media.findUnique({
            where: { id: mediaId },
        });

        if (!media) {
            throw new NotFoundException('Report not found');
        }

        if (media.status !== MediaStatus.READY) {
            throw new BadRequestException('Report is not ready');
        }

        // Download from S3
        const buffer = await this._s3Service.DownloadFile(media.location);

        return buffer;
    }
}
