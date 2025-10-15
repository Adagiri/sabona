import { Injectable } from '@nestjs/common';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import AppConfig from 'src/configs/app.config';

@Injectable()
export class EmailService {
    private sesClient: SESClient;
    private adminEmails: string[];
    private fromEmail: string;

    constructor() {
        this.sesClient = new SESClient({
            region: AppConfig.AWS.REGION || 'us-east-1',
            credentials: {
                accessKeyId: process.env.APP_AWS_ACCESS_KEY!,
                secretAccessKey: process.env.APP_AWS_SECRET_KEY!,
            },
        });

        this.adminEmails = (AppConfig.APP.ADMIN_EMAILS || '').split(',').filter(Boolean);
        this.fromEmail = AppConfig.AWS.SES_FROM_EMAIL || 'no-reply@sabonah.com';
    }

    async sendCustomOrderAlert(orderId: string, customerName: string, orderDetails: any) {
        const subject = `🆕 New Custom Order - ${orderId}`;
        const body = `
New custom order created and needs admin review:

Order ID: ${orderId}
Customer: ${customerName}
Laundry: ${orderDetails.customLaundryName}
Location: ${orderDetails.customLaundryAddress}
Description: ${orderDetails.customLaundryDescription}

Pickup: ${orderDetails.pickupAddress}
Pickup Date: ${orderDetails.pickupDate}

View order in admin panel: ${AppConfig.APP.ADMIN_PANEL_URL}/custom-orders/${orderId}
        `.trim();

        return this.sendEmail(this.adminEmails, subject, body);
    }

    private async sendEmail(toAddresses: string[], subject: string, body: string) {
        if (!toAddresses.length) {
            console.warn('No admin emails configured');
            return;
        }

        const command = new SendEmailCommand({
            Source: this.fromEmail,
            Destination: { ToAddresses: toAddresses },
            Message: {
                Subject: { Data: subject },
                Body: { Text: { Data: body } },
            },
        });

        try {
            const response = await this.sesClient.send(command);
            console.log(`✅ Email sent to admins: ${response.MessageId}`);
            return response;
        } catch (error) {
            console.error('❌ Failed to send email:', error);
            throw error;
        }
    }
}
