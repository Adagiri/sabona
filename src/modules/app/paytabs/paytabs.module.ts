import { Module } from '@nestjs/common';
import PayTabsController from './paytabs.controller';
import DatabaseModule from '../../../database/database.module';
import AdminCustomOrderModule from '../admin/adminCustomOrder.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
    imports: [DatabaseModule, AdminCustomOrderModule, NotificationModule],
    controllers: [PayTabsController],
})
export default class PayTabsModule {}
