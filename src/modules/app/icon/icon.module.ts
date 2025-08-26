import { Module } from '@nestjs/common';
import IconController from './icon.controller';
import IconService from './icon.service';
import DatabaseModule from '../../../database/database.module';

@Module({
    imports: [DatabaseModule],
    controllers: [IconController],
    providers: [IconService],
    exports: [IconService],
})
export default class IconModule {}
