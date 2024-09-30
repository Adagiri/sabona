import { INestApplication } from '@nestjs/common';
import { ResponseInterceptor } from '../../core/interceptors/response.interceptor';
import { TranslatorService } from 'nestjs-translator';
import { LocationInterceptor } from '../interceptors/location.interceptor';
import UserService from 'src/modules/app/user/user.service';
import AuthService from 'src/modules/app/auth/auth.service';

export default function InjectInterceptors(app: INestApplication) {
    app.useGlobalInterceptors(new ResponseInterceptor(app.get(TranslatorService)));
    app.useGlobalInterceptors(new LocationInterceptor(app.get(UserService), app.get(AuthService)));
}
