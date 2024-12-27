import { Module } from '@nestjs/common';
import DatabaseModule from '../../../database/database.module';
import AdminService from './admin.service';
import AdminController from './admin.controller';
import UserService from '../user/user.service';
import OrderModule from '../order/order.module';


@Module({
    imports: [DatabaseModule , OrderModule],
    exports: [AdminService],
    providers: [AdminService],
    controllers: [AdminController],
})
export default class AdminModule {}
