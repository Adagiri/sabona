import { Module } from '@nestjs/common';
import DatabaseModule from '../../../database/database.module';
import CustomerService from './customer.service';
import CustomerController from './customer.controller';
import { NotificationModule } from '../notification/notification.module';


@Module({
    imports: [DatabaseModule , NotificationModule],
    exports: [CustomerService],
    providers: [CustomerService],
    controllers: [CustomerController],
})
export default class CustomerModule {}
