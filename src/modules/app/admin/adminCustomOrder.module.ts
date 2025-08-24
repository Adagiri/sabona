import { Module } from '@nestjs/common';
import AdminCustomOrderService from './adminCustomOrder.service';
import DatabaseModule from '../../../database/database.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
    imports: [DatabaseModule, NotificationModule],
    providers: [AdminCustomOrderService],
    exports: [AdminCustomOrderService],
})
export default class AdminCustomOrderModule {}
