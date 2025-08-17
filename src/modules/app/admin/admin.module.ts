import { Module } from '@nestjs/common';
import DatabaseModule from '../../../database/database.module';
import AdminService from './admin.service';
import AdminController from './admin.controller';
import OrderModule from '../order/order.module';
import { NotificationModule } from '../notification/notification.module';
import MediaModule from '../media/media.module';
import S3Service from '../media/s3.service';
import VendorModule from '../vendor/vendor.module';


@Module({
    imports: [DatabaseModule, OrderModule, NotificationModule, MediaModule, VendorModule],
    exports: [AdminService],
    providers: [AdminService, S3Service],
    controllers: [AdminController],
})
export default class AdminModule {}
