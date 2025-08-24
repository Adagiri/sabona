import { Injectable } from '@nestjs/common';

@Injectable()
export default class PayTabsService {
    constructor() {}

    /**
     * Create PayTabs payment request (if you need more control than the mock in AdminCustomOrderService)
     */
    async createPaymentRequest(orderData: any): Promise<any> {
        const payTabsConfig = {
            profile_id: process.env.PAYTABS_PROFILE_ID,
            server_key: process.env.PAYTABS_SERVER_KEY,
            base_url: process.env.PAYTABS_BASE_URL || 'https://secure.paytabs.com',
        };

        const paymentRequest = {
            profile_id: payTabsConfig.profile_id,
            tran_type: 'sale',
            tran_class: 'ecom',
            cart_description: `Custom laundry order #${orderData.orderNumber} payment`,
            cart_currency: 'SAR',
            cart_amount: orderData.totalAmount,
            cart_id: orderData.orderId,
            customer_details: {
                name: `${orderData.user.firstName} ${orderData.user.lastName}`,
                email: orderData.user.email || 'customer@example.com',
                phone: orderData.user.phone,
                street1: 'Customer Address',
                city: 'Riyadh',
                state: 'Riyadh',
                country: 'SA',
                zip: '11564',
            },
            shipping_details: {
                name: `${orderData.user.firstName} ${orderData.user.lastName}`,
                email: orderData.user.email || 'customer@example.com',
                phone: orderData.user.phone,
                street1: 'Customer Address',
                city: 'Riyadh',
                state: 'Riyadh',
                country: 'SA',
                zip: '11564',
            },
            callback: `${process.env.APP_URL}/api/v1/paytabs/callback`,
            return: `${process.env.APP_URL}/api/v1/paytabs/return`,
        };

        try {
            const response = await fetch(`${payTabsConfig.base_url}/payment/request`, {
                method: 'POST',
                headers: {
                    Authorization: payTabsConfig.server_key,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(paymentRequest),
            });

            if (!response.ok) {
                throw new Error(`PayTabs API error: ${response.status}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('PayTabs payment request failed:', error);
            throw error;
        }
    }

    /**
     * Query payment status from PayTabs
     */
    async queryPaymentStatus(transactionRef: string): Promise<any> {
        const payTabsConfig = {
            profile_id: process.env.PAYTABS_PROFILE_ID,
            server_key: process.env.PAYTABS_SERVER_KEY,
            base_url: process.env.PAYTABS_BASE_URL || 'https://secure.paytabs.com',
        };

        const queryRequest = {
            profile_id: payTabsConfig.profile_id,
            tran_ref: transactionRef,
        };

        try {
            const response = await fetch(`${payTabsConfig.base_url}/payment/query`, {
                method: 'POST',
                headers: {
                    Authorization: payTabsConfig.server_key,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(queryRequest),
            });

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('PayTabs status query failed:', error);
            throw error;
        }
    }
}
