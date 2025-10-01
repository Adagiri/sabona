import { Module } from '@nestjs/common';
import DatabaseModule from '../../../database/database.module';
import AdminService from './admin.service';
import AdminController from './admin.controller';
import OrderModule from '../order/order.module';
import { NotificationModule } from '../notification/notification.module';
import MediaModule from '../media/media.module';
import S3Service from '../media/s3.service';
import VendorModule from '../vendor/vendor.module';
import CustomOrderModule from '../customOrder/customOrder.module';
import AdminCustomOrderModule from './adminCustomOrder.module';
import SMSModule from 'src/modules/sms/sms.module';


@Module({
    // ADD THIS
    imports: [
        DatabaseModule,
        OrderModule,
        NotificationModule,
        MediaModule,
        VendorModule,
        CustomOrderModule,
        AdminCustomOrderModule,
        SMSModule
    ],
    exports: [AdminService],
    providers: [AdminService, S3Service],
    controllers: [AdminController],
})
export default class AdminModule {}
