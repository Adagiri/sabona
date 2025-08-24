import { Module } from '@nestjs/common';
import CustomOrderService from './customOrder.service';
import CustomOrderController from './customOrder.controller';
import DatabaseModule from '../../../database/database.module';
import {NotificationModule} from '../notification/notification.module';

@Module({
    imports: [DatabaseModule, NotificationModule],
    providers: [CustomOrderService],
    controllers: [CustomOrderController],
    exports: [CustomOrderService],
})
export default class CustomOrderModule {}
