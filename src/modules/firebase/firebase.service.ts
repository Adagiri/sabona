import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { SendMultipleNotificationResponseDTO } from '../app/notification/dto/response/notification.response';
import SendNotificationRequestDTO, {
    MultipleDeviceNotificationDto,
} from '../app/notification/dto/request/notification.request';
import { BadRequestException } from '../../core/exceptions/response.exception';
import AppConfig from '../../configs/app.config';

@Injectable()
export default class FirebaseService {
    constructor() {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: AppConfig.FIREBASE.PROJECT_ID,
                clientEmail: AppConfig.FIREBASE.CLIENT_EMAIL,
                privateKey: AppConfig.FIREBASE.PRIVATE_KEY,
            }),
        });
    }

    async SendNotificationOneSingleDevice(data: SendNotificationRequestDTO) {
        try {
            const { token, title, body } = data;
            await admin.messaging().send({
                token,
                notification: { title: title, body: body },
            });
            return { message: 'Notification sent successfully' };
        } catch (error) {
            throw new BadRequestException(`Failed to send notification: ${error.message}`);
        }
    }

    async SendNotificationToMultipleTokens(data: MultipleDeviceNotificationDto) {
        try {
            const { tokens, title, body } = data;
            const notificationData = data?.notificationData;
            const message = {
                notification: { title, body },
                tokens,
                data:
                    (notificationData && {
                        orderId: notificationData.orderId,
                        key: notificationData.key,
                        route: notificationData.route,
                    }) ||
                    {},
            };
            const res = await admin.messaging().sendEachForMulticast(message);
            return res as SendMultipleNotificationResponseDTO;
        } catch (error) {
            throw new BadRequestException(`Failed to send notifications to multiple tokens: ${error.message}`);
        }
    }

    async verifyToken(token: string) {
        try {
            console.log(JSON.stringify(AppConfig));

            return await admin.auth().verifyIdToken(token);
        } catch (error) {
            console.log(error);
        }
    }
}
