import { Module } from '@nestjs/common';
import DatabaseModule from '../../../database/database.module';
import LocationService from './location.service';

@Module({
    imports: [DatabaseModule],
    exports: [LocationService],
    providers: [LocationService],
    controllers: [],
})
export default class LocationModule {}
