// ============================================================================
// FILE: src/modules/app/withdrawal/withdrawal.module.ts
// ============================================================================

import { Module } from '@nestjs/common';
import { WithdrawalController } from './withdrawal.controller';
import WithdrawalService from './withdrawal.service';
import DatabaseModule from '../../../database/database.module';
import MediaModule from '../media/media.module';
import MediaService from '../media/media.service';
import S3Service from '../media/s3.service';

@Module({
    imports: [DatabaseModule, MediaModule],
    controllers: [WithdrawalController],
    providers: [WithdrawalService, MediaService, S3Service],
    exports: [WithdrawalService],
})
export class WithdrawalModule {}
