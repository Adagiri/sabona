import { INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ResponseInterceptor } from '../../core/interceptors/response.interceptor';
import { LocationInterceptor } from '../interceptors/location.interceptor';
import UserService from 'src/modules/app/user/user.service';
import AuthService from 'src/modules/app/auth/auth.service';
import { I18nService } from 'nestjs-i18n';
import { TranslationInterceptor } from '../interceptors/translation.interceptor';
import { DateSerializerInterceptor } from '../interceptors/dateSerializer.interceptor';

export default function InjectInterceptors(app: INestApplication) {
    const reflector = app.get(Reflector);
    app.useGlobalInterceptors(new ResponseInterceptor(app.get(I18nService)));
    app.useGlobalInterceptors(new LocationInterceptor(app.get(UserService), app.get(AuthService)));
    app.useGlobalInterceptors(new TranslationInterceptor(reflector));
    app.useGlobalInterceptors(new DateSerializerInterceptor());
}
