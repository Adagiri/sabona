import { Module } from '@nestjs/common';
import DatabaseModule from '../../../database/database.module';
import AdminService from './admin.service';
import AdminController from './admin.controller';
import UserService from '../user/user.service';


@Module({
    imports: [DatabaseModule],
    exports: [AdminService],
    providers: [AdminService],
    controllers: [AdminController],
})
export default class AdminModule {}
