import { Module } from '@nestjs/common';
import NotificationController from './notification.controller';
import NotificationService from './notification.service';
import UserModule from '../user/user.module';
// import { FirebaseModule } from 'src/modules/firebase/firebase.module';
import { FirebaseModule } from '../../../modules/firebase/firebase.module';
import DatabaseModule from '../../../database/database.module';
// import DatabaseModule from 'src/database/database.module';

@Module({
    imports: [UserModule, FirebaseModule, DatabaseModule],
    exports: [NotificationService],
    providers: [NotificationService],
    controllers: [NotificationController],
})
export class NotificationModule {}
