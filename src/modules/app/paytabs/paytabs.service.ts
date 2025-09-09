import { Injectable, BadRequestException } from '@nestjs/common';
import DatabaseService from '../../../database/database.service';
import NotificationService from '../notification/notification.service';
import { extractTokens } from 'src/helpers/util.helper';
import * as crypto from 'crypto';
import { Order, OrderStatus, OrderType, PaymentStatus, PaymentTransactionType } from '@prisma/client';
import AppConfig from 'src/configs/app.config';

export interface PayTabsWebhookData {
    cart_id?: string;
    merchant_reference_id?: string;
    tran_ref?: string;
    tran_total?: string;
    response_status?: string;

    payment_result?: {
        response_status?: string;
        response_code?: string;
        response_message?: string;
        auth_code?: string;
    };
}

export interface WebhookProcessingResult {
    success: boolean;
    message: string;
    orderId?: string;
}

@Injectable()
export default class PayTabsService {
    constructor(
        private _dbService: DatabaseService,
        private _notificationService: NotificationService,
    ) {}

    /**
     * Main webhook handler - routes to appropriate order type handler
     */
    async handleWebhook(webhookData: PayTabsWebhookData, headers: any): Promise<WebhookProcessingResult> {
        try {
            console.log(typeof headers);
            // Validate webhook signature
            // await this.validatePayTabsSignature(webhookData, headers);
            // Extract order information
            const orderId = webhookData.cart_id || webhookData.merchant_reference_id;
            // const orderId = '554184b9-9237-46c6-85bf-f3f4c4f6e734';
            const transactionRef = webhookData.tran_ref;
            const amount = parseFloat(webhookData.tran_total || '0');
            const status = this.mapPayTabsStatus(webhookData.response_status);

            if (!orderId) {
                throw new BadRequestException('Missing order ID in webhook data');
            }
            // Get order to determine type
            const order = await this._dbService.order.findUnique({
                where: { id: orderId },
                include: {
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true,
                            phone: true,
                        },
                    },
                    laundry: {
                        select: { name: true },
                    },
                },
            });

            if (!order) {
                throw new BadRequestException('Order not found');
            }

            // Route to appropriate handler based on order type
            const processedData = {
                transactionRef,
                amount,
                status,
                provider: 'paytabs',
                rawData: webhookData,
            };
            if (order.orderType === OrderType.REGISTERED_LAUNDRY) {
                await this.handleRegularOrderPayment(order, processedData);
            } else if (order.orderType === OrderType.CUSTOM_LAUNDRY) {
                await this.handleCustomOrderPayment(order, processedData);
            } else {
                throw new BadRequestException('Unknown order type');
            }

            return {
                success: true,
                message: 'Webhook processed successfully',
                orderId: orderId,
            };
        } catch (error) {
            console.error('PayTabs webhook processing failed:', error);

            return {
                success: false,
                message: error.message || 'Webhook processing failed',
            };
        }
    }

    /**
     * Handle payment for regular (registered laundry) orders
     */
    async handleRegularOrderPayment(order: any, webhookData: any): Promise<void> {
        try {
            if (webhookData.status === 'success') {
                await this.handleRegularOrderSuccess(order, webhookData);
            } else if (webhookData.status === 'failed') {
                await this.handleRegularOrderFailure(order);
            }
        } catch (error) {
            console.error('Error handling regular order payment:', error);
            throw error;
        }
    }

    /**
     * Handle payment for custom laundry orders
     */
    async handleCustomOrderPayment(order: Order, webhookData: any): Promise<void> {
        try {
            if (webhookData.status === 'success') {
                await this.handleCustomOrderSuccess(order, webhookData);
            } else if (webhookData.status === 'failed') {
                await this.handleCustomOrderFailure(order);
            }
        } catch (error) {
            console.error('Error handling custom order payment:', error);
            throw error;
        }
    }

    /**
     * Handle successful regular order payment
     */
    private async handleRegularOrderSuccess(order: Order, webhookData: any): Promise<void> {
        try {
            await this._dbService.$transaction(async (tx) => {
                // Update order payment status
                await tx.order.update({
                    where: { id: order.id },
                    data: {
                        paid: true,
                        status: OrderStatus.PENDING,
                        paymentStatus: PaymentStatus.COMPLETED,
                    },
                });

                // Create/update payment record
                await tx.payment.upsert({
                    where: { orderId: order.id },
                    update: {
                        transactionRef: webhookData.transactionRef,
                        amount: webhookData.amount,
                        paymentMethod: 'ONLINE',
                        status: 'COMPLETED',
                        type: 'Sale',
                    },
                    create: {
                        orderId: order.id,
                        transactionRef: webhookData.transactionRef,
                        amount: webhookData.amount,
                        paymentMethod: 'ONLINE',
                        status: 'COMPLETED',
                        paymentType: PaymentTransactionType.ORDER,
                        tipTransactionId: null,
                        type: 'Sale',
                    },
                });

                // Add status history
                await tx.orderStatusHistory.create({
                    data: {
                        orderId: order.id,
                        status: OrderStatus.PENDING,
                        timestamp: new Date(),
                    },
                });
            });

            // Send notifications
            await this.sendRegularOrderSuccessNotifications(order);
        } catch (error) {
            console.error('Error handling regular order success:', error);
            throw error;
        }
    }

    /**
     * Handle successful custom order payment (customer pays reimbursement)
     */
    private async handleCustomOrderSuccess(order: any, webhookData: any): Promise<void> {
        try {
            await this._dbService.$transaction(async (tx) => {
                // Update custom order payment status
                await tx.order.update({
                    where: { id: order.id },
                    data: {
                        customerPaid: true,
                        customerPaymentDate: new Date(),
                        paymentStatus: PaymentStatus.COMPLETED,
                        payTabsTransactionRef: webhookData.transactionRef,
                    },
                });

                // Create payment record for custom order
                await tx.payment.upsert({
                    where: { orderId: order.id },
                    update: {
                        transactionRef: webhookData.transactionRef,
                        amount: webhookData.amount,
                        paymentMethod: 'ONLINE',
                        status: 'COMPLETED',
                        type: 'Sale',
                    },
                    create: {
                        orderId: order.id,
                        transactionRef: webhookData.transactionRef,
                        amount: webhookData.amount,
                        paymentMethod: 'ONLINE',
                        status: 'COMPLETED',
                        paymentType: PaymentTransactionType.ORDER,
                        tipTransactionId: null,
                        type: 'Sale',
                    },
                });

                // Update status history
                await tx.orderStatusHistory.create({
                    data: {
                        orderId: order.id,
                        status: OrderStatus.IN_PROGRESS, // Custom orders complete after customer payment
                        timestamp: new Date(),
                    },
                });

                // Update order status to completed
                await tx.order.update({
                    where: { id: order.id },
                    data: { status: OrderStatus.IN_PROGRESS },
                });
            });

            // Send notifications
            await this.sendCustomOrderSuccessNotifications(order);
        } catch (error) {
            console.error('Error handling custom order success:', error);
            throw error;
        }
    }

    /**
     * Handle regular order payment failure
     */
    private async handleRegularOrderFailure(order: any): Promise<void> {
        try {
            await this._dbService.$transaction(async (tx) => {
                // Update order payment status
                await tx.order.update({
                    where: { id: order.id },
                    data: {
                        paid: false,
                        paymentStatus: PaymentStatus.FAILED,
                    },
                });

                // CREATE: Payment record for failed payment
                await tx.payment.upsert({
                    where: { orderId: order.id },
                    update: {
                        status: 'FAILED',
                        type: 'Sale',
                    },
                    create: {
                        orderId: order.id,
                        transactionRef: `FAILED-${Date.now()}`, // Generate unique ref for failed payments
                        amount: order.totalAmount || 0,
                        paymentMethod: 'ONLINE',
                        status: 'FAILED',
                        paymentType: PaymentTransactionType.ORDER,
                        tipTransactionId: null,
                        type: 'Sale',
                    },
                });
            });

            await this.sendPaymentFailureNotifications(order, 'Please try again to complete your payment.');
        } catch (error) {
            console.error('Error handling regular order failure:', error);
            throw error;
        }
    }

    /**
     * Handle custom order payment failure
     */
    private async handleCustomOrderFailure(order: any): Promise<void> {
        try {
            await this._dbService.$transaction(async (tx) => {
                // Update order payment status
                await tx.order.update({
                    where: { id: order.id },
                    data: {
                        customerPaid: false,
                        paymentStatus: PaymentStatus.FAILED,
                    },
                });

                // CREATE: Payment record for failed payment
                await tx.payment.upsert({
                    where: { orderId: order.id },
                    update: {
                        status: 'FAILED',
                        type: 'Sale',
                    },
                    create: {
                        orderId: order.id,
                        transactionRef: `FAILED-${Date.now()}`,
                        amount: order.totalAmount || 0,
                        paymentMethod: 'ONLINE',
                        status: 'FAILED',
                        paymentType: PaymentTransactionType.ORDER,
                        tipTransactionId: null,
                        type: 'Sale',
                    },
                });
            });

            await this.sendPaymentFailureNotifications(order, 'Please complete the reimbursement payment.');
        } catch (error) {
            console.error('Error handling custom order failure:', error);
            throw error;
        }
    }

    /**
     * Send notifications for regular order payment success
     */
    private async sendRegularOrderSuccessNotifications(order: any): Promise<void> {
        try {
            // Notify customer
            await this.sendCustomerSuccessNotification(
                order,
                'Payment Successful',
                `Payment confirmed for order #${order.orderNumber}. Your order is now being processed.`,
            );

            // Notify vendors about new paid order
            if (order.laundryId) {
                await this.sendVendorNotifications(order);
            }
        } catch (error) {
            console.error('Error sending regular order success notifications:', error);
            throw error;
        }
    }

    /**
     * Send notifications for custom order payment success
     */
    private async sendCustomOrderSuccessNotifications(order: any): Promise<void> {
        try {
            // Notify customer
            await this.sendCustomerSuccessNotification(
                order,
                'Payment Complete',
                `Reimbursement payment confirmed for custom order #${order.orderNumber}. Order is now complete.`,
            );

            // Notify admin about completed custom order
            // await this.sendAdminCustomOrderCompleteNotification(order);
        } catch (error) {
            console.error('Error sending custom order success notifications:', error);
            throw error;
        }
    }

    /**
     * Send customer success notification
     */
    private async sendCustomerSuccessNotification(order: any, title: string, body: string): Promise<void> {
        try {
            const customerTokens = await this._dbService.deviceToken.findMany({
                where: { userId: order.userId, deletedAt: null },
            });

            if (customerTokens.length > 0) {
                const tokens = extractTokens(customerTokens);

                await this._notificationService.SendNotificationToMultipleTokens({
                    tokens: tokens,
                    title: title,
                    body: body,
                    notificationData: {
                        orderId: order.id,
                        key: 'GET_ORDER_BY_ID',
                        route: 'TrackOrder',
                    },
                });

                // Create notification record
                await this._dbService.notification.create({
                    data: {
                        userId: order.userId,
                        orderId: order.id,
                        message: title,
                        status: 'UNREAD',
                        type: 'ORDER_PAID',
                        data: {
                            orderId: order.id,
                            transactionRef: order.payTabsTransactionRef,
                        },
                    },
                });
            }
        } catch (error) {
            console.error('Error sending customer success notification:', error);
            throw error;
        }
    }

    /**
     * Send vendor notifications for new paid orders
     */
    private async sendVendorNotifications(order: any): Promise<void> {
        try {
            const laundries = await this._dbService.laundry.findMany({
                where: { id: order.laundryId },
                include: {
                    vendor: {
                        include: {
                            DeviceToken: {
                                where: { deletedAt: null },
                            },
                        },
                    },
                },
            });

            for (const laundry of laundries) {
                if (laundry.vendor.DeviceToken.length > 0) {
                    const vendorTokens = extractTokens(laundry.vendor.DeviceToken);

                    await this._notificationService.SendNotificationToMultipleTokens({
                        tokens: vendorTokens,
                        title: 'New Paid Order',
                        body: `Order #${order.orderNumber} payment confirmed. Please accept or reject.`,
                        notificationData: {
                            orderId: order.id,
                            key: 'FETCH_VENDOR_REQUESTS',
                            route: 'Home',
                        },
                    });
                }
            }
        } catch (error) {
            console.error('Error sending vendor notifications:', error);
            throw error;
        }
    }

    /**
     * Send admin notification for completed custom order
     */
    private async sendAdminCustomOrderCompleteNotification(order: any): Promise<void> {
        try {
            // Get admin users
            const adminUsers = await this._dbService.user.findMany({
                where: { type: 'ADMIN' },
                include: {
                    DeviceToken: {
                        where: { deletedAt: null },
                    },
                },
            });

            for (const admin of adminUsers) {
                if (admin.DeviceToken.length > 0) {
                    const adminTokens = extractTokens(admin.DeviceToken);

                    await this._notificationService.SendNotificationToMultipleTokens({
                        tokens: adminTokens,
                        title: 'Custom Order Complete',
                        body: `Customer payment received for custom order #${order.orderNumber}. Order is now complete.`,
                        notificationData: {
                            orderId: order.id,
                            key: 'CUSTOM_ORDER_COMPLETE',
                            route: 'AdminOrders',
                        },
                    });
                }
            }
        } catch (error) {
            console.error('Error sending admin custom order complete notification:', error);
            throw error;
        }
    }

    /**
     * Send payment failure notifications
     */
    private async sendPaymentFailureNotifications(order: any, additionalMessage: string): Promise<void> {
        try {
            const customerTokens = await this._dbService.deviceToken.findMany({
                where: { userId: order.userId, deletedAt: null },
            });

            if (customerTokens.length > 0) {
                const tokens = extractTokens(customerTokens);

                await this._notificationService.SendNotificationToMultipleTokens({
                    tokens: tokens,
                    title: 'Payment Failed',
                    body: `Payment for order #${order.orderNumber} was unsuccessful. ${additionalMessage}`,
                    notificationData: {
                        orderId: order.id,
                        key: 'GET_ORDER_BY_ID',
                        route: 'TrackOrder',
                    },
                });
            }
        } catch (error) {
            console.error('Error sending payment failure notifications:', error);
            throw error;
        }
    }

    /**
     * Validate PayTabs webhook signature
     */
    private async validatePayTabsSignature(webhookData: any, headers: any): Promise<void> {
        try {
            const receivedSignature = headers['x-paytabs-signature'] || headers['signature'];

            if (!receivedSignature) {
                console.warn('PayTabs webhook received without signature');
                return;
            }

            const serverKey = AppConfig.PAYTABS.SERVER_KEY;
            if (!serverKey) {
                console.warn('PayTabs server key not configured');
                return;
            }
            // console.log(receivedSignature, serverKey);
            const dataString = JSON.stringify(webhookData);
            const expectedSignature = crypto.createHmac('sha256', serverKey).update(dataString).digest('hex');

            if (receivedSignature !== expectedSignature) {
                throw new BadRequestException('Invalid PayTabs webhook signature');
            }
        } catch (error) {
            console.error('Error validating PayTabs signature:', error);
            throw error;
        }
    }

    /**
     * Map PayTabs status to our status format
     */
    private mapPayTabsStatus(payTabsStatus?: string): string {
        switch (payTabsStatus) {
            case 'A':
                return 'success';
            case 'H':
                return 'pending';
            case 'D':
            case 'V':
            case 'F':
                return 'failed';
            default:
                return 'unknown';
        }
    }
}
