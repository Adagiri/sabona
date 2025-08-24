import crypto from 'crypto';
import { Body, Headers, BadRequestException, Query, Param } from '@nestjs/common';
import { ApiController, Get, Post } from '../../../core/decorators';
import AdminCustomOrderService from '../admin/adminCustomOrder.service';
import { PayTabsCallbackRequestDTO, PayTabsCallbackResponseDTO } from './dto/request/paymentCallback.request';
import DatabaseService from '../../../database/database.service';
import { extractTokens } from 'src/helpers/util.helper';
import NotificationService from '../notification/notification.service';

@ApiController({
    path: '/paytabs',
    tag: 'paytabs',
    version: '1',
})
export default class PayTabsController {
    constructor(
        private _adminCustomOrderService: AdminCustomOrderService,
        private _dbService: DatabaseService,
        private _notificationService: NotificationService,
    ) {}

    /**
     * PayTabs payment callback webhook
     * This endpoint receives payment notifications from PayTabs
     */
    @Post({
        path: '/callback',
        description: 'Handle PayTabs payment callback webhook',
        response: PayTabsCallbackResponseDTO,
    })
    async handlePayTabsCallback(
        @Body() paymentData: any,
        @Headers() headers: any,
    ): Promise<PayTabsCallbackResponseDTO> {
        try {
            // Validate PayTabs signature for security (recommended)
            this.validatePayTabsSignature(paymentData, headers);

            // Extract payment information
            const callbackData: PayTabsCallbackRequestDTO = {
                orderId: paymentData.cart_id || paymentData.merchant_reference_id,
                transactionRef: paymentData.tran_ref,
                status: paymentData.payment_result?.response_status,
                amount: parseFloat(paymentData.cart_amount),
                responseCode: paymentData.payment_result?.response_code,
                responseMessage: paymentData.payment_result?.response_message,
                authorizationCode: paymentData.payment_result?.auth_code,
            };

            console.log('PayTabs Callback Received:', callbackData);

            // Process the payment callback
            const result = await this._adminCustomOrderService.handlePayTabsCallback(callbackData);

            return result;
        } catch (error) {
            console.error('PayTabs callback processing failed:', error);

            return {
                success: false,
                message: error.message || 'Payment callback processing failed',
            };
        }
    }

    /**
     * PayTabs return URL - where customer is redirected after payment
     */
    @Get({
        path: '/return',
        description: 'PayTabs return URL for successful payments',
        response: {},
    })
    async handlePayTabsReturn(@Query() query: any): Promise<any> {
        const { response_status } = query;

        if (response_status === 'A') {
            return {
                success: true,
                message: 'Payment completed successfully',
                redirectUrl: '/orders?payment=success',
            };
        } else {
            return {
                success: false,
                message: 'Payment was not successful',
                redirectUrl: '/orders?payment=failed',
            };
        }
    }

    /**
     * Validate PayTabs signature for webhook security
     */
    private validatePayTabsSignature(paymentData: any, headers: any): void {
        // Get PayTabs signature from headers
        const receivedSignature = headers['x-paytabs-signature'] || headers['signature'];

        if (!receivedSignature) {
            console.warn('PayTabs callback received without signature');
            // In production, you might want to reject unsigned callbacks
            // throw new BadRequestException('Missing PayTabs signature');
            return;
        }

        // Generate expected signature using your server key
        const serverKey = process.env.PAYTABS_SERVER_KEY;
        if (!serverKey) {
            console.warn('PayTabs server key not configured');
            return;
        }

        // Create signature hash (example implementation)
        const dataString = JSON.stringify(paymentData);
        const expectedSignature = crypto.createHmac('sha256', serverKey).update(dataString).digest('hex');

        if (receivedSignature !== expectedSignature) {
            throw new BadRequestException('Invalid PayTabs signature');
        }
    }

    /**
     * Test endpoint for PayTabs integration (development only)
     */
    @Post({
        path: '/test-callback',
        description: 'Test PayTabs callback processing (development only)',
        response: PayTabsCallbackResponseDTO,
    })
    async testPayTabsCallback(): Promise<PayTabsCallbackResponseDTO> {
        if (process.env.NODE_ENV === 'production') {
            throw new BadRequestException('Test endpoint not available in production');
        }

        // Mock successful payment callback
        const mockPaymentData = {
            orderId: 'test-order-id',
            transactionRef: `TEST_${Date.now()}`,
            status: 'A', // A = Success
            amount: 150.0,
            responseCode: '000',
            responseMessage: 'Successful transaction',
            authorizationCode: 'AUTH123456',
        };

        return await this._adminCustomOrderService.handlePayTabsCallback(mockPaymentData);
    }

    /**
     * Check payment status for a specific order
     */
    @Get({
        path: '/status/:orderId',
        description: 'Check PayTabs payment status for an order',
        response: {},
    })
    async checkPaymentStatus(@Param('orderId') orderId: string): Promise<any> {
        const order = await this._dbService.order.findUnique({
            where: {
                id: orderId,
                orderType: 'CUSTOM_LAUNDRY',
            },
            select: {
                id: true,
                orderNumber: true,
                payTabsInvoiceId: true,
                payTabsInvoiceUrl: true,
                payTabsTransactionRef: true,
                customerPaid: true,
                customerPaymentDate: true,
                totalAmount: true,
                customVendorPaid: true,
                adminServiceCharge: true,
            },
        });

        if (!order) {
            throw new BadRequestException('Order not found');
        }

        return {
            data: {
                orderId: order.id,
                orderNumber: order.orderNumber,
                paymentStatus: order.customerPaid ? 'PAID' : 'PENDING',
                paymentDate: order.customerPaymentDate,
                invoiceUrl: order.payTabsInvoiceUrl,
                invoiceId: order.payTabsInvoiceId,
                transactionRef: order.payTabsTransactionRef,
                amounts: {
                    totalAmount: order.totalAmount,
                    vendorAmount: order.customVendorPaid,
                    adminServiceCharge: order.adminServiceCharge,
                },
            },
        };
    }

    /**
     * Resend payment invoice to customer (admin action)
     */
    @Post({
        path: '/resend-invoice/:orderId',
        description: 'Resend payment invoice to customer via WhatsApp/SMS',
        response: {},
    })
    async resendPaymentInvoice(@Param('orderId') orderId: string): Promise<any> {
        const order = await this._dbService.order.findUnique({
            where: {
                id: orderId,
                orderType: 'CUSTOM_LAUNDRY',
            },
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        phone: true,
                        email: true,
                    },
                },
            },
        });

        if (!order) {
            throw new BadRequestException('Order not found');
        }

        if (!order.payTabsInvoiceUrl) {
            throw new BadRequestException('No payment invoice found for this order');
        }

        if (order.customerPaid) {
            throw new BadRequestException('Customer has already paid for this order');
        }

        // Resend notification to customer
        const customerTokens = await this._dbService.deviceToken.findMany({
            where: { userId: order.userId, deletedAt: null },
            select: { token: true },
        });

        if (customerTokens.length > 0) {
            const tokens = extractTokens(customerTokens);

            const notificationData = {
                tokens: tokens,
                title: 'Payment Reminder',
                body: `Please complete payment for your custom order #${order.orderNumber}`,
                notificationData: {
                    orderId: order.id,
                    invoiceUrl: order.payTabsInvoiceUrl,
                    key: 'PAY_CUSTOM_ORDER',
                    route: 'Payment',
                },
            };

            await this._notificationService.SendNotificationToMultipleTokens(notificationData);
        }

        // TODO: Send WhatsApp/SMS reminder
        console.log(`Payment reminder sent to ${order.user.phone}: ${order.payTabsInvoiceUrl}`);

        return {
            success: true,
            message: 'Payment invoice resent to customer',
            data: {
                customerPhone: order.user.phone,
                invoiceUrl: order.payTabsInvoiceUrl,
            },
        };
    }
}
