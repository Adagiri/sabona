import { Module } from '@nestjs/common';
import PayTabsController from './paytabs.controller';
import DatabaseModule from '../../../database/database.module';
import AdminCustomOrderModule from '../admin/adminCustomOrder.module';

@Module({
    imports: [DatabaseModule, AdminCustomOrderModule],
    controllers: [PayTabsController],
})
export default class PayTabsModule {}
