import { Module } from '@nestjs/common';
import DatabaseModule from '../../../database/database.module';
import AuthModule from '../../../modules/app/auth/auth.module';
import TokenModule from '../../../modules/app/token/token.module';
import UserSettingsModule from './user_settings/user_settings.module';
import AuthController from './auth.controller';
import UserController from './user.controller';
import UserService from './user.service';
import OAuthModule from '../../../modules/oauth/oauth.module';
import SMSModule from 'src/modules/sms/sms.module';
import { FirebaseModule } from 'src/modules/firebase/firebase.module';

@Module({
    imports: [
        DatabaseModule,
        AuthModule,
        TokenModule,
        UserSettingsModule,
        OAuthModule,
        SMSModule,
        FirebaseModule
    ],
    exports: [UserService],
    providers: [UserService],
    controllers: [AuthController, UserController],
})
export default class UserModule {}
