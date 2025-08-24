import { Module } from '@nestjs/common';
import DatabaseModule from '../../../database/database.module';
import CustomerService from './customer.service';
import CustomerController from './customer.controller';
import { NotificationModule } from '../notification/notification.module';
import CustomOrderModule from '../customOrder/customOrder.module';


@Module({
    imports: [DatabaseModule, NotificationModule, CustomOrderModule],
    exports: [CustomerService],
    providers: [CustomerService],
    controllers: [CustomerController],
})
export default class CustomerModule {}
