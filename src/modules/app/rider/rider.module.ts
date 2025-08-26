import { Module } from '@nestjs/common';
import DatabaseModule from '../../../database/database.module';
import RiderService from './rider.service';
import RiderController from './rider.controller';
import { NotificationModule } from '../notification/notification.module';
import LocationModule from '../location/location.module';


@Module({
    imports: [DatabaseModule , NotificationModule, LocationModule],
    exports: [RiderService],
    providers: [RiderService],
    controllers: [RiderController],
})
export default class RiderModule {}
