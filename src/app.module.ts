import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import RedisModule from './core/cache/redis.module';
import DatabaseModule from './database/database.module';
import AuthModule from './modules/app/auth/auth.module';
import UserModule from './modules/app/user/user.module';
import DeviceModule from './modules/app/device/device.module';
import MediaModule from './modules/app/media/media.module';
import CronModule from './modules/cron/cron.module';
import OAuthModule from './modules/oauth/oauth.module';
import { HttpExceptionFilter } from './core/exceptions/http.exception';
import AuthGuard from './modules/app/auth/auth.guard';
import { EventEmitterModule } from '@nestjs/event-emitter';
import CustomerModule from './modules/app/customer/customer.module';
import RiderModule from './modules/app/rider/rider.module';
import VendorModule from './modules/app/vendor/vendor.module';
import OrderModule from './modules/app/order/order.module';
import AdminModule from './modules/app/admin/admin.module';
import { NotificationModule } from './modules/app/notification/notification.module';
import { FirebaseModule } from './modules/firebase/firebase.module';
import PaymentsModule from './modules/app/payments/payments.module';
import { HeaderResolver, I18nModule } from 'nestjs-i18n';
import * as path from 'path';
import CustomOrderModule from './modules/app/customOrder/customOrder.module';
import PayTabsModule from './modules/app/paytabs/paytabs.module';
import AdminCustomOrderModule from './modules/app/admin/adminCustomOrder.module';
import IconModule from './modules/app/icon/icon.module';
import { WithdrawalModule } from './modules/app/withdrawal/withdrawal.module';

@Module({
    imports: [
        I18nModule.forRoot({
            fallbackLanguage: 'en',
            loaderOptions: {
                path: path.join(__dirname, '../i18n/'),
                watch: true,
            },
            resolvers: [new HeaderResolver(['locale'])],
            logging: true, // Add this to debug
        }),
        EventEmitterModule.forRoot(),
        RedisModule,
        DatabaseModule,
        AuthModule,
        UserModule,
        DeviceModule,
        MediaModule,
        CronModule,
        OAuthModule,
        CustomerModule,
        RiderModule,
        VendorModule,
        OrderModule,
        AdminModule,
        NotificationModule,
        FirebaseModule,
        PaymentsModule,
        CustomOrderModule,
        PayTabsModule,
        AdminCustomOrderModule,
        IconModule,
        WithdrawalModule,
    ],
    controllers: [AppController],
    providers: [
        AppService,
        { provide: APP_FILTER, useClass: HttpExceptionFilter },
        { provide: APP_GUARD, useClass: AuthGuard },
    ],
})
export class AppModule {}
