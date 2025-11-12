import { Injectable } from '@nestjs/common';
import AppConfig from '../../configs/app.config';
import axios from 'axios';

@Injectable()
export default class SMSService {
    private _apiUrl = 'https://api.authentica.sa/api/v2';

    constructor() {
        if (!AppConfig.AUTHENTICA.API_KEY) {
            console.warn('AUTHENTICA API_KEY not configured');
        }
    }

    async sendVerificationCode(phone: string) {
        try {
            const response = await axios.post(
                `${this._apiUrl}/send-otp`,
                {
                    phone: phone,
                    method: 'sms',
                    template_id: '8',
                    sender_name: 'Soapss',
                    otp_format: 'numeric',
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-Authorization': AppConfig.AUTHENTICA.API_KEY,
                    },
                },
            );

            return response.data.success;
        } catch (error) {
            console.log('AUTHENTICA ERROR', error.response?.data || error);
            throw error;
        }
    }

    async verifyPhoneNumber(phoneNumber: string, verificationCode: string): Promise<any> {
        try {
            const response = await axios.post(
                `${this._apiUrl}/verify-otp`,
                {
                    phone: phoneNumber,
                    otp: verificationCode,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-Authorization': AppConfig.AUTHENTICA.API_KEY,
                    },
                },
            );
            if (response.data.status === true) {
                return { success: true, message: response.data.message };
            }

            return { success: false, message: 'Invalid code' };
        } catch (error) {
            console.log(error);
            let errorMessage;
            const status = error.response?.statusCode;

            switch (status) {
                case 404:
                    errorMessage = 'Code not found, try to request a new one';
                    break;
                case 400:
                    errorMessage = 'Invalid code';
                    break;
                case 429:
                    errorMessage = 'Max check attempts reached, please wait 10 minutes before retrying';
                    break;
                case 403:
                    errorMessage = 'Invalid code';
                    break;
                case 422:
                    errorMessage = 'Failed to verify OTP';
                    break;
                default:
                    errorMessage = error.response?.data?.message || error.message;
                    break;
            }
            return { success: false, message: errorMessage };
        }
    }
}
