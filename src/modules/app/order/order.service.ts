import { Injectable } from '@nestjs/common';
import DatabaseService from 'src/database/database.service';
import { BadRequestException } from 'src/core/exceptions/response.exception';
import { User } from '@prisma/client';
@Injectable()
export default class OrderService {
    constructor(private _dbService: DatabaseService) {}
    async getOrderById(orderId: string): Promise<any> {
        const order = await this._dbService.order.findUnique({
            where: { id: orderId },
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
                laundry: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                        lat: true,
                        long: true,
                        vendor: {
                            select: {
                                firstName: true,
                                lastName: true,
                                phone: true,
                            },
                        },
                    },
                },
                services: {
                    include: {
                        laundryService: {
                            select: {
                                id: true,
                                name: true,
                                description: true,
                            },
                        },
                        items: {
                            include: {
                                laundryServiceItem: {
                                    select: {
                                        id: true,
                                        name: true,
                                        vendorPrice: true,
                                        platformPrice: true,
                                        expressVendorPrice: true,
                                        expressPlatformPrice: true,
                                        price: true, // DEPRECATED: Keep for backward compatibility
                                    },
                                },
                            },
                        },
                    },
                },
                riderOrders: {
                    where: { deletedAt: null },
                    include: {
                        rider: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                phone: true,
                            },
                        },
                    },
                },
                pickup: true,
                delivery: true,
                statusHistory: {
                    orderBy: { timestamp: 'desc' },
                },
                tip: {
                    include: {
                        rider: {
                            select: {
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
            },
        });

        if (!order) {
            throw new BadRequestException('Order not found');
        }

        // Add expressPrice for backward compatibility
        const transformedOrder = {
            ...order,
            services: order.services.map(service => ({
                ...service,
                items: service.items.map(item => ({
                    ...item,
                    laundryServiceItem: {
                        ...item.laundryServiceItem,
                        expressPrice: item.laundryServiceItem.expressVendorPrice,
                    },
                })),
            })),
        };

        return { data: transformedOrder };
    }

    async getOrderStatusProgress(orderId: string, user: User): Promise<any> {
        // Get order with status history and feedback
        const order = await this._dbService.order.findUnique({
            where: { id: orderId },
            include: {
                statusHistory: {
                    orderBy: { timestamp: 'asc' },
                },
                feedbacks: {
                    where: { userId: user.id },
                },
                payment: true,
            },
        });

        if (!order) {
            throw new BadRequestException('Order not found');
        }

        // Verify user owns this order (for customer endpoints)
        if (order.userId !== user.id) {
            throw new BadRequestException('Unauthorized to view this order');
        }

        // Get all completed statuses from history
        const completedStatuses = new Set(order.statusHistory.map((history) => history.status));
        completedStatuses.add(order.status); // Include current status

        // Map internal statuses to customer-facing progression
        const statusProgression = {
            ORDER_PLACED: this.hasOrderBeenPlaced(completedStatuses),
            ORDER_PAID: this.hasOrderBeenPaid(order, completedStatuses),
            ORDER_ACCEPTED: this.hasOrderBeenAccepted(completedStatuses),
            ORDER_PROCESSING: this.hasOrderBeenProcessing(completedStatuses),
            ORDER_REJECTED: this.hasOrderBeenRejected(completedStatuses),
            ORDER_PICKED_UP: this.hasOrderBeenPickedUp(completedStatuses),
            ORDER_DELIVERED: this.hasOrderBeenDelivered(completedStatuses),
            FEEDBACK_SUBMITTED: this.hasFeedbackBeenSubmitted(order.feedbacks),
        };

        return {
            orderId: order.id,
            currentStatus: order.status,
            statusProgression,
            orderDetails: {
                totalAmount: order.totalAmount,
                orderNumber: order.orderNumber,
                createdAt: order.createdAt,
            },
        };
    }

    private hasOrderBeenPlaced(completedStatuses: Set<string>): boolean {
        // Order is placed when it exists (any status except cancelled means it was placed)
        return !completedStatuses.has('CANCELLED');
    }

    private hasOrderBeenPaid(order: any, completedStatuses: Set<string>): boolean {
        // Check payment record or paid flag or if order moved past PENDING_PAYMENT
        return (
            order.paid === true ||
            order.payment?.status === 'COMPLETED' ||
            completedStatuses.has('PENDING') ||
            completedStatuses.has('ACCEPTED') ||
            completedStatuses.has('IN_PROGRESS') ||
            completedStatuses.has('READY_FOR_PICKUP') ||
            completedStatuses.has('COMPLETED')
        );
    }

    private hasOrderBeenAccepted(completedStatuses: Set<string>): boolean {
        return (
            completedStatuses.has('ACCEPTED') ||
            completedStatuses.has('IN_PROGRESS') ||
            completedStatuses.has('READY_FOR_PICKUP') ||
            completedStatuses.has('COMPLETED')
        );
    }

    private hasOrderBeenProcessing(completedStatuses: Set<string>): boolean {
        return (
            completedStatuses.has('IN_PROGRESS') ||
            completedStatuses.has('READY_FOR_PICKUP') ||
            completedStatuses.has('COMPLETED')
        );
    }

    private hasOrderBeenRejected(completedStatuses: Set<string>): boolean {
        return completedStatuses.has('REJECTED');
    }

    private hasOrderBeenPickedUp(completedStatuses: Set<string>): boolean {
        // This would need to be tracked via pickup status or specific status history
        return completedStatuses.has('READY_FOR_PICKUP') || completedStatuses.has('COMPLETED');
    }

    private hasOrderBeenDelivered(completedStatuses: Set<string>): boolean {
        return completedStatuses.has('COMPLETED');
    }

    private hasFeedbackBeenSubmitted(feedbacks: any[]): boolean {
        return feedbacks && feedbacks.length > 0;
    }
}
