import { Module } from '@nestjs/common';
import DatabaseModule from '../../../database/database.module';
import CustomerService from './customer.service';
import CustomerController from './customer.controller';
import { NotificationModule } from '../notification/notification.module';
import CustomOrderModule from '../customOrder/customOrder.module';
import LocationModule from '../location/location.module';
import AdminModule from '../admin/admin.module';
import { EmailService } from 'src/services/email.service';

@Module({
    imports: [DatabaseModule, NotificationModule, CustomOrderModule, LocationModule, AdminModule],
    exports: [CustomerService],
    providers: [CustomerService, EmailService],
    controllers: [CustomerController],
})
export default class CustomerModule {}
