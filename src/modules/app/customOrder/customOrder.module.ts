import { Module } from '@nestjs/common';
import CustomOrderService from './customOrder.service';
import CustomOrderController from './customOrder.controller';
import DatabaseModule from '../../../database/database.module';
import {NotificationModule} from '../notification/notification.module';
import { EmailService } from '../../../services/email.service';

@Module({
    imports: [DatabaseModule, NotificationModule],
    providers: [CustomOrderService, EmailService],
    controllers: [CustomOrderController],
    exports: [CustomOrderService],
})
export default class CustomOrderModule {}
