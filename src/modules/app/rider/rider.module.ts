import { Module } from '@nestjs/common';
import DatabaseModule from '../../../database/database.module';
import RiderService from './rider.service';
import RiderController from './rider.controller';
import { NotificationModule } from '../notification/notification.module';


@Module({
    imports: [DatabaseModule , NotificationModule],
    exports: [RiderService],
    providers: [RiderService],
    controllers: [RiderController],
})
export default class RiderModule {}
