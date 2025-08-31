import { Module } from '@nestjs/common';
import DatabaseModule from 'src/database/database.module';
import VendorService from './vendor.service';
import VendorController from './vendor.controller';
import { NotificationModule } from '../notification/notification.module';
import SMSModule from 'src/modules/sms/sms.module';
import AuthModule from '../auth/auth.module';
import LocationModule from '../location/location.module';

@Module({
    imports: [DatabaseModule, NotificationModule, DatabaseModule, SMSModule, AuthModule, LocationModule],
    exports: [VendorService],
    providers: [VendorService],
    controllers: [VendorController],
})
export default class VendorModule {}
