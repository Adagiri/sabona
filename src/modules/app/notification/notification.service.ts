import { Injectable } from '@nestjs/common';
import SendNotificationRequestDTO, { MultipleDeviceNotificationDto } from './dto/request/notification.request';
import * as admin from 'firebase-admin';
import { SendMultipleNotificationResponseDTO, SendNotificationResponseDTO } from './dto/response/notification.response';
import FirebaseService from 'src/modules/firebase/firebase.service';

@Injectable()
export default class NotificationService {

  constructor(private _firebaseService: FirebaseService) { }

  async SendNotification(data: SendNotificationRequestDTO): Promise<SendNotificationResponseDTO> {
    const { token, title, body } = data;
    return this._firebaseService.SendNotificationOneSingleDevice({ token, title, body });
  }

  async SendNotificationToMultipleTokens(data: MultipleDeviceNotificationDto): Promise<SendMultipleNotificationResponseDTO> {
    return this._firebaseService.SendNotificationToMultipleTokens(data);
  }


}
