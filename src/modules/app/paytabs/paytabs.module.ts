import { Module } from '@nestjs/common';
import DatabaseModule from '../../../database/database.module';
import { NotificationModule } from '../notification/notification.module';
import PayTabsService from './paytabs.service';
import PayTabsController from './paytabs.controller';
import { EmailService } from 'src/services/email.service';

@Module({
    imports: [DatabaseModule, NotificationModule],
    exports: [PayTabsService],
    providers: [PayTabsService, EmailService],
    controllers: [PayTabsController],
})
export default class PayTabsModule {}
