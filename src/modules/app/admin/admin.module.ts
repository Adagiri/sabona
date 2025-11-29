import { Module } from '@nestjs/common';
import DatabaseModule from '../../../database/database.module';
import AdminService from './admin.service';
import AdminController from './admin.controller';
import DashboardService from './dashboard.service';
import FinanceService from './finance.service';
import { AdminDashboardController } from './admin-dashboard.controller';
import OrderModule from '../order/order.module';
import { NotificationModule } from '../notification/notification.module';
import MediaModule from '../media/media.module';
import S3Service from '../media/s3.service';
import VendorModule from '../vendor/vendor.module';
import CustomOrderModule from '../customOrder/customOrder.module';
import AdminCustomOrderModule from './adminCustomOrder.module';
import SMSModule from 'src/modules/sms/sms.module';
import PayTabsService from '../paytabs/paytabs.service';
import { EmailService } from 'src/services/email.service';


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
    exports: [AdminService, DashboardService, FinanceService],
    providers: [AdminService, DashboardService, FinanceService, S3Service, PayTabsService, EmailService],
    controllers: [AdminController, AdminDashboardController],
})
export default class AdminModule {}
