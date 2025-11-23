import { Injectable } from '@nestjs/common';
import DatabaseService from '../../../database/database.service';
import { OrderStatus, OrderType, User, UserType, RiderOrderType, Order } from '@prisma/client';
import { BadRequestException } from 'src/core/exceptions/response.exception';
import NotificationService from '../notification/notification.service';
import { extractTokens } from 'src/helpers/util.helper';
import { UploadCustomOrderReceiptRequestDTO } from './dto/request/uploadCustomOrderReceipt.request';
import AppConfig from 'src/configs/app.config';

interface PayTabsInvoiceResponse {
    invoiceId: string;
    invoiceUrl: string;
    transactionRef: string;
}

@Injectable()
export default class AdminCustomOrderService {
    constructor(
        private _dbService: DatabaseService,
        private _notificationService: NotificationService,
    ) {}

    /**
     * Assign driver to custom order for pickup phase
     */
    async assignDriverToCustomOrder(orderId: string, riderId: string, adminUser: User): Promise<any> {
        // Validate order exists and is pending
        const order = await this._dbService.order.findUnique({
            where: {
                id: orderId,
                orderType: OrderType.CUSTOM_LAUNDRY,
            },
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        phone: true,
                    },
                },
            },
        });

        if (!order) {
            throw new BadRequestException('Custom order not found');
        }

        if (order.status !== OrderStatus.PENDING) {
            throw new BadRequestException('Can only assign driver to pending custom orders');
        }

        // Validate driver exists and is available
        const driver = await this._dbService.user.findUnique({
            where: {
                id: riderId,
                type: UserType.RIDER,
                status: 'ACTIVE',
            },
        });

        if (!driver) {
            throw new BadRequestException('Driver not found or inactive');
        }

        // Check if driver is already assigned to this order
        const existingAssignment = await this._dbService.riderOrder.findFirst({
            where: {
                orderId: orderId,
                riderId: riderId,
                deletedAt: null,
            },
        });

        if (existingAssignment) {
            throw new BadRequestException('Driver already assigned to this order');
        }

        // Create rider assignment for PICKUP phase
        const riderAssignment = await this._dbService.riderOrder.create({
            data: {
                orderId: orderId,
                riderId: riderId,
                type: RiderOrderType.RIDER_PICKUP,
            },
        });

        // Update order status to ACCEPTED
        await this._dbService.order.update({
            where: { id: orderId },
            data: { status: OrderStatus.ACCEPTED },
        });

        // Update pickup with assigned rider
        await this._dbService.pickup.update({
            where: { orderId: orderId },
            data: {
                riderId: riderId,
                status: 'ACCEPTED',
            },
        });

        // Notify assigned driver
        await this.notifyDriverAssignment(riderId, order, 'PICKUP');

        // Notify customer about driver assignment
        await this.notifyCustomerDriverAssigned(order.userId, order, driver);

        // Create admin activity log
        await this._dbService.notification.create({
            data: {
                userId: adminUser.id,
                orderId: orderId,
                message: `Assigned driver ${driver.firstName} ${driver.lastName} to custom order #${order.orderNumber}`,
                status: 'UNREAD',
                data: {
                    orderId: orderId,
                    riderId: riderId,
                    action: 'DRIVER_ASSIGNED',
                    phase: 'PICKUP',
                },
                type: 'ORDER_ACCEPTED',
            },
        });

        return {
            data: {
                assignmentId: riderAssignment.id,
                orderId: orderId,
                riderId: riderId,
                driverName: `${driver.firstName} ${driver.lastName}`,
                phase: 'PICKUP',
            },
            message: `Driver ${driver.firstName} ${driver.lastName} assigned successfully for pickup phase`,
        };
    }

    /**
     * Upload receipt for custom order (admin uploads after driver sends via WhatsApp)
     */
    async uploadCustomOrderReceipt(
        orderId: string,
        receiptData: UploadCustomOrderReceiptRequestDTO, // Changed signature
        adminUser: User,
    ): Promise<any> {
        const order = await this._dbService.order.findUnique({
            where: {
                id: orderId,
                orderType: OrderType.CUSTOM_LAUNDRY,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        email: true,
                    },
                },
            },
        });

        if (!order) {
            throw new BadRequestException('Custom order not found');
        }

        if (order.customVendorReceipt) {
            throw new BadRequestException('Receipt already uploaded for this order');
        }

        // Get media record by ID
        const receiptMedia = await this._dbService.media.findUnique({
            where: { id: parseInt(receiptData.receiptImageId) },
        });

        if (!receiptMedia) {
            throw new BadRequestException('Receipt image not found');
        }

        // Update order with receipt information
        await this._dbService.order.update({
            where: { id: orderId },
            data: {
                customVendorReceipt: receiptMedia.path, // Use media path
                customVendorName: receiptData.vendorName,
                customVendorPaid: receiptData.amountPaid,
                customPaymentMethod: receiptData.paymentMethod,
                totalAmount: receiptData.amountPaid, // Set customer invoice amount
                status: OrderStatus.IN_PROGRESS,
            },
        });

        // Generate PayTabs invoice
        const payTabsInvoice = await this.generatePayTabsInvoice(order, receiptData.amountPaid);

        // Update order with PayTabs info
        await this._dbService.order.update({
            where: { id: orderId },
            data: {
                payTabsInvoiceId: payTabsInvoice.invoiceId,
                payTabsInvoiceUrl: payTabsInvoice.invoiceUrl,
                payTabsTransactionRef: payTabsInvoice.transactionRef,
                payTabsInvoiceDateCreated: new Date(),
            },
        });

        // Notify customer with payment link
        await this.notifyCustomerPaymentRequired(order.user, order, payTabsInvoice.invoiceUrl);

        // Create admin activity log
        await this._dbService.notification.create({
            data: {
                userId: adminUser.id,
                orderId: orderId,
                message: `Receipt uploaded and PayTabs invoice generated for custom order #${order.orderNumber}`,
                status: 'UNREAD',
                data: {
                    orderId: orderId,
                    action: 'RECEIPT_UPLOADED',
                    amountPaid: receiptData.amountPaid,
                    vendorName: receiptData.vendorName,
                    invoiceUrl: payTabsInvoice.invoiceUrl,
                },
                type: 'ORDER_PROCESSING',
            },
        });

        return {
            data: {
                orderId: orderId,
                receiptUploaded: true,
                payTabsInvoice: {
                    invoiceId: payTabsInvoice.invoiceId,
                    invoiceUrl: payTabsInvoice.invoiceUrl,
                },
                vendorDetails: {
                    name: receiptData.vendorName,
                    amountPaid: receiptData.amountPaid,
                    paymentMethod: receiptData.paymentMethod,
                },
            },
            message: 'Receipt uploaded and payment invoice sent to customer',
        };
    }
    /**
     * Generate PayTabs invoice for customer payment recovery
     */
    private async generatePayTabsInvoice(order: Order, vendorAmount: number): Promise<PayTabsInvoiceResponse> {
        // Validate inputs
        // if (!order.user.email) {
        //     throw new Error('Customer email is required for payment processing');
        // }

        if (vendorAmount <= 0) {
            throw new Error('Invalid payment amount');
        }

        try {
            const response = await fetch(`https://secure.paytabs.sa/payment/request`, {
                method: 'POST',
                headers: {
                    // CRITICAL: Must be lowercase 'authorization', NOT 'Authorization'
                    authorization: AppConfig.PAYTABS.SERVER_KEY, // Direct key, no "Bearer"
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    profile_id: AppConfig.PAYTABS.PROFILE_ID,
                    tran_type: 'sale',
                    tran_class: 'ecom',
                    cart_id: order.id,
                    cart_description: `Custom laundry order #${order.orderNumber}`,
                    cart_currency: 'SAR',
                    cart_amount: vendorAmount,
                    customer_details: {
                        name: 'Ridwan',
                        email: 'ibrahimridwan47@gmail.com',
                        phone: '+2348037296906',
                        street1: 'N/A',
                        city: 'Riyadh',
                        state: 'Riyadh',
                        country: 'SA',
                        zip: '00000',
                    },
                    hide_shipping: true,
                    payment_methods: ['creditcard', 'mada', 'applepay'],
                    callback: `http://localhost:8080/api/v1/webhook/paytabs`,
                    return: `http://localhost:8080/orders/${order.id}/payment-success`,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('PayTabs API error:', errorText);
                throw new Error(`PayTabs API failed with status ${response.status}: ${errorText}`);
            }

            const payTabsResponse = await response.json();

            if (!payTabsResponse.redirect_url || !payTabsResponse.tran_ref) {
                console.error('Invalid PayTabs response:', payTabsResponse);
                throw new Error(payTabsResponse.message || 'PayTabs response missing required fields');
            }

            return {
                invoiceId: payTabsResponse.tran_ref,
                invoiceUrl: payTabsResponse.redirect_url,
                transactionRef: payTabsResponse.tran_ref,
            };
        } catch (error) {
            console.error('Error generating PayTabs invoice:', error);
            throw error; // Re-throw, don't return mock data
        }
    }

    /**
     * Mark custom order as ready for delivery and assign delivery driver
     */
    async markCustomOrderReadyForDelivery(orderId: string, deliveryRiderId?: string): Promise<any> {
        const order = await this._dbService.order.findUnique({
            where: {
                id: orderId,
                orderType: OrderType.CUSTOM_LAUNDRY,
            },
            include: {
                riderOrders: {
                    where: { deletedAt: null },
                    include: {
                        rider: {
                            select: {
                                firstName: true,
                                lastName: true,
                                phone: true,
                            },
                        },
                    },
                },
            },
        });

        if (!order) {
            throw new BadRequestException('Custom order not found');
        }

        if (!order.customerPaid) {
            throw new BadRequestException('Customer must pay invoice before order can proceed to delivery');
        }

        // Update order status
        await this._dbService.order.update({
            where: { id: orderId },
            data: { status: OrderStatus.READY_FOR_PICKUP },
        });

        // Assign delivery driver (could be same or different from pickup driver)
        if (deliveryRiderId) {
            const deliveryDriver = await this._dbService.user.findUnique({
                where: {
                    id: deliveryRiderId,
                    type: UserType.RIDER,
                    status: 'ACTIVE',
                },
            });

            if (!deliveryDriver) {
                throw new BadRequestException('Delivery driver not found or inactive');
            }

            // Create delivery assignment
            await this._dbService.riderOrder.create({
                data: {
                    orderId: orderId,
                    riderId: deliveryRiderId,
                    type: RiderOrderType.RIDER_DELIVERY,
                },
            });

            // Update delivery with assigned rider
            await this._dbService.delivery.update({
                where: { orderId: orderId },
                data: {
                    riderId: deliveryRiderId,
                    status: 'ACCEPTED',
                },
            });

            // Notify delivery driver
            await this.notifyDriverAssignment(deliveryRiderId, order, 'DELIVERY');
        }

        return {
            data: {
                orderId: orderId,
                status: 'READY_FOR_PICKUP',
                deliveryDriverAssigned: !!deliveryRiderId,
            },
            message: 'Custom order marked as ready for delivery',
        };
    }

    /**
     * Handle PayTabs payment callback
     */
    async handlePayTabsCallback(paymentData: any): Promise<any> {
        const { transactionRef, status, amount } = paymentData;

        const order = await this._dbService.order.findFirst({
            where: {
                payTabsTransactionRef: transactionRef,
                orderType: OrderType.CUSTOM_LAUNDRY,
            },
        });

        if (!order) {
            throw new BadRequestException('Order not found for payment callback');
        }

        if (status === 'A' || status === 'CAPTURED') {
            // Payment successful
            await this._dbService.order.update({
                where: { id: order.id },
                data: {
                    customerPaid: true,
                    customerPaymentDate: new Date(),
                },
            });

            // Notify customer about successful payment
            await this.notifyCustomerPaymentSuccess(order.userId, order);

            // Notify admin about payment completion
            const admins = await this._dbService.user.findMany({
                where: { type: UserType.ADMIN },
                select: { id: true },
            });

            for (const admin of admins) {
                await this._dbService.notification.create({
                    data: {
                        userId: admin.id,
                        orderId: order.id,
                        message: `Customer paid invoice for custom order #${order.orderNumber}. Ready for delivery assignment.`,
                        status: 'UNREAD',
                        data: {
                            orderId: order.id,
                            action: 'PAYMENT_RECEIVED',
                            amount: amount,
                        },
                        type: 'ORDER_PROCESSING',
                    },
                });
            }

            return { success: true, message: 'Payment processed successfully' };
        } else {
            // Payment failed - notify admin
            const admins = await this._dbService.user.findMany({
                where: { type: UserType.ADMIN },
                select: { id: true },
            });

            for (const admin of admins) {
                await this._dbService.notification.create({
                    data: {
                        userId: admin.id,
                        orderId: order.id,
                        message: `Payment failed for custom order #${order.orderNumber}. Customer may need to retry.`,
                        status: 'UNREAD',
                        data: {
                            orderId: order.id,
                            action: 'PAYMENT_FAILED',
                            reason: status,
                        },
                        type: 'ORDER_REJECTED',
                    },
                });
            }

            return { success: false, message: 'Payment failed' };
        }
    }

    /**
     * Regenerate payment link for custom order
     * Can only regenerate if:
     * - Previous link is older than 20 minutes
     * - Payment has not been received yet
     */
    async regeneratePaymentLink(orderId: string, adminUser: User): Promise<any> {
        const order = await this._dbService.order.findUnique({
            where: {
                id: orderId,
                orderType: OrderType.CUSTOM_LAUNDRY,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        email: true,
                    },
                },
            },
        });

        if (!order) {
            throw new BadRequestException('Custom order not found');
        }

             // Check if payment has already been received
        if (order.status === OrderStatus.CANCELLED) {
            throw new BadRequestException('This order has already been cancelled');
        }

        // Check if payment has already been received
        if (order.customerPaid) {
            throw new BadRequestException('Payment has already been received for this order');
        }

        // Check if payment link exists
        if (!order.payTabsInvoiceUrl || !order.payTabsInvoiceDateCreated) {
            throw new BadRequestException('No payment link exists for this order');
        }

        // Check if payment link is older than 20 minutes
        const now = new Date();
        const linkCreatedAt = new Date(order.payTabsInvoiceDateCreated);
        const timeDifferenceInMinutes = (now.getTime() - linkCreatedAt.getTime()) / (1000 * 60);

        if (timeDifferenceInMinutes < 20) {
            const remainingMinutes = Math.ceil(20 - timeDifferenceInMinutes);
            throw new BadRequestException(
                `Payment link can only be regenerated after 20 minutes. Please wait ${remainingMinutes} more minute(s)`,
            );
        }

        // Generate new PayTabs invoice
        const payTabsInvoice = await this.generatePayTabsInvoice(order, order.totalAmount);

        // Update order with new PayTabs info
        await this._dbService.order.update({
            where: { id: orderId },
            data: {
                payTabsInvoiceId: payTabsInvoice.invoiceId,
                payTabsInvoiceUrl: payTabsInvoice.invoiceUrl,
                payTabsTransactionRef: payTabsInvoice.transactionRef,
                payTabsInvoiceDateCreated: new Date(),
            },
        });

        // Notify customer with new payment link
        await this.notifyCustomerPaymentRequired(order.user, order, payTabsInvoice.invoiceUrl);

        // Create admin activity log
        await this._dbService.notification.create({
            data: {
                userId: adminUser.id,
                orderId: orderId,
                message: `Payment link regenerated for custom order #${order.orderNumber}`,
                status: 'UNREAD',
                data: {
                    orderId: orderId,
                    action: 'PAYMENT_LINK_REGENERATED',
                    newInvoiceUrl: payTabsInvoice.invoiceUrl,
                },
                type: 'ORDER_PROCESSING',
            },
        });

        return {
            data: {
                orderId: orderId,
                payTabsInvoice: {
                    invoiceId: payTabsInvoice.invoiceId,
                    invoiceUrl: payTabsInvoice.invoiceUrl,
                },
            },
            message: 'Payment link regenerated successfully and sent to customer',
        };
    }

    /**
     * Get available drivers for assignment
     */
    async getAvailableDriversForCustomOrder(orderId: string): Promise<any> {
        const order = await this._dbService.order.findUnique({
            where: { id: orderId },
            select: {
                pickup: {
                    select: {
                        pickupLat: true,
                        pickupLong: true,
                    },
                },
            },
        });

        if (!order || !order.pickup) {
            throw new BadRequestException('Order not found');
        }

        // Get all active riders
        const availableRiders = await this._dbService.user.findMany({
            where: {
                type: UserType.RIDER,
                status: 'ACTIVE',
                location: { isNot: null },
            },
            include: {
                location: true,
                RiderOrder: {
                    where: {
                        deletedAt: null,
                        order: {
                            status: {
                                in: [OrderStatus.ACCEPTED, OrderStatus.IN_PROGRESS, OrderStatus.READY_FOR_PICKUP],
                            },
                        },
                    },
                },
            },
        });

        const availableDriversWithDistance = availableRiders
            .map((rider) => {
                const distance = this.calculateDistance(
                    order.pickup!.pickupLat,
                    order.pickup!.pickupLong,
                    rider.location!.lat,
                    rider.location!.long,
                );

                return {
                    riderId: rider.id,
                    firstName: rider.firstName,
                    lastName: rider.lastName,
                    phone: rider.phone,
                    distance: Math.round(distance * 100) / 100,
                    isAvailable: true,
                };
            })
            .sort((a, b) => a.distance - b.distance);

        return { data: availableDriversWithDistance };
    }

    /**
     * Notify driver about assignment
     */
    private async notifyDriverAssignment(riderId: string, order: any, phase: 'PICKUP' | 'DELIVERY'): Promise<void> {
        const driverTokens = await this._dbService.deviceToken.findMany({
            where: { userId: riderId, deletedAt: null },
            select: { token: true },
        });

        const tokens = extractTokens(driverTokens);

        if (tokens?.length) {
            const notificationData = {
                tokens: tokens,
                title: `Custom Order ${phase} Assignment!`,
                body:
                    phase === 'PICKUP'
                        ? `New custom order pickup assignment #${order.orderNumber}`
                        : `Custom order delivery assignment #${order.orderNumber}`,
                notificationData: {
                    orderId: order.id,
                    key: 'FETCH_ASSIGNED_ORDERS',
                    route: 'AssignedRides',
                    orderType: 'CUSTOM',
                },
            };

            await this._notificationService.SendNotificationToMultipleTokens(notificationData);

            await this._dbService.notification.create({
                data: {
                    userId: riderId,
                    orderId: order.id,
                    message: `You have been assigned to ${phase.toLowerCase()} custom order #${order.orderNumber}`,
                    status: 'UNREAD',
                    data: {
                        orderId: order.id,
                        key: 'FETCH_ASSIGNED_ORDERS',
                        route: 'AssignedRides',
                        phase: phase,
                    },
                    type: 'ORDER_ACCEPTED',
                },
            });
        }
    }

    /**
     * Notify customer about driver assignment
     */
    private async notifyCustomerDriverAssigned(userId: string, order: any, driver: any): Promise<void> {
        const customerTokens = await this._dbService.deviceToken.findMany({
            where: { userId: userId, deletedAt: null },
            select: { token: true },
        });

        const tokens = extractTokens(customerTokens);

        if (tokens?.length) {
            const notificationData = {
                tokens: tokens,
                title: 'Driver Assigned!',
                body: `${driver.firstName} ${driver.lastName} has been assigned to your custom order`,
                notificationData: {
                    orderId: order.id,
                    key: 'FETCH_ORDERS',
                    route: 'Orders',
                },
            };

            await this._notificationService.SendNotificationToMultipleTokens(notificationData);
        }
    }

    /**
     * Notify customer payment is required
     */
    private async notifyCustomerPaymentRequired(user: any, order: any, invoiceUrl: string): Promise<void> {
        console.log(user, ' :user');
        console.log(order.userId, ' :userId');
        const userId = order.userId || user.id;
        const customerTokens = await this._dbService.deviceToken.findMany({
            where: { userId: userId, deletedAt: null },
            select: { token: true },
        });
        console.log(customerTokens, ' :customer tokens');
        const tokens = extractTokens(customerTokens);

        // Send push notification
        if (tokens?.length) {
            const notificationData = {
                tokens: tokens,
                title: 'Payment Required',
                body: `Please pay the invoice for your custom order #${order.orderNumber}`,
                notificationData: {
                    orderId: order.id,
                    invoiceUrl: invoiceUrl,
                    key: 'PAY_CUSTOM_ORDER',
                    route: 'Payment',
                },
            };

            await this._notificationService.SendNotificationToMultipleTokens(notificationData);
        }
    }

    /**
     * Notify customer about successful payment
     */
    private async notifyCustomerPaymentSuccess(userId: string, order: any): Promise<void> {
        const customerTokens = await this._dbService.deviceToken.findMany({
            where: { userId: userId, deletedAt: null },
            select: { token: true },
        });

        const tokens = extractTokens(customerTokens);

        if (tokens?.length) {
            const notificationData = {
                tokens: tokens,
                title: 'Payment Confirmed!',
                body: `Your payment for custom order #${order.orderNumber} has been received. Your items will be delivered soon.`,
                notificationData: {
                    orderId: order.id,
                    key: 'FETCH_ORDERS',
                    route: 'Orders',
                },
            };

            await this._notificationService.SendNotificationToMultipleTokens(notificationData);
        }
    }

    /**
     * Calculate distance between two points
     */
    private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private toRadians(degrees: number): number {
        return degrees * (Math.PI / 180);
    }
}
