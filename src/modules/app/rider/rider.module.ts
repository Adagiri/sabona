import { Module } from '@nestjs/common';
import DatabaseModule from '../../../database/database.module';
import RiderService from './rider.service';
import RiderController from './rider.controller';


@Module({
    imports: [DatabaseModule],
    exports: [RiderService],
    providers: [RiderService],
    controllers: [RiderController],
})
export default class RiderModule {}
