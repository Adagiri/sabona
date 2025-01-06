import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { SendMultipleNotificationResponseDTO } from '../app/notification/dto/response/notification.response';
import SendNotificationRequestDTO, { MultipleDeviceNotificationDto } from '../app/notification/dto/request/notification.request';
import { BadRequestException } from 'src/core/exceptions/response.exception';

@Injectable()
export default class FirebaseService {
    constructor() {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.APP_FIREBASE_PROJECT_ID,
                clientEmail: process.env.APP_FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.APP_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
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
            const notificationData = data?.notificationData
            const message = {
                notification: { title, body },
                tokens,
                data : notificationData && {
                    orderId: notificationData.orderId,
                    key: notificationData.key,
                    route: notificationData.route,
                } || {},
            };
            const res = await admin.messaging().sendEachForMulticast(message);
            return res as SendMultipleNotificationResponseDTO;
        } catch (error) {
            throw new BadRequestException(`Failed to send notifications to multiple tokens: ${error.message}`);
        }
    }
}
