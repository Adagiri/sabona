import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TranslatorModule } from 'nestjs-translator';
import RedisModule from './core/cache/redis.module';
import DatabaseModule from './database/database.module';
import AuthModule from './modules/app/auth/auth.module';
import UserModule from './modules/app/user/user.module';
import DeviceModule from './modules/app/device/device.module';
import MediaModule from './modules/app/media/media.module';
import CronModule from './modules/cron/cron.module';
import QueueModule from './modules/queue/queue.module';
import EmailModule from './modules/email/email.module';
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
@Module({
    imports: [
        TranslatorModule.forRoot({
            defaultLang: 'en',
            global: true,
            requestKeyExtractor(req) {
                return req.headers['locale'];
            },
            translationSource: './dist/i18n',
        }),
        EventEmitterModule.forRoot(),
        RedisModule,
        DatabaseModule,
        AuthModule,
        UserModule,
        DeviceModule,
        MediaModule,
        CronModule,
        QueueModule,
        EmailModule,
        OAuthModule,
        CustomerModule,
        RiderModule,
        VendorModule,
        OrderModule,
        AdminModule,
        NotificationModule,
        FirebaseModule,
        PaymentsModule,
    ],
    controllers: [AppController],
    providers: [
        AppService,
        { provide: APP_FILTER, useClass: HttpExceptionFilter },
        { provide: APP_GUARD, useClass: AuthGuard },
    ],
})
export class AppModule {}
