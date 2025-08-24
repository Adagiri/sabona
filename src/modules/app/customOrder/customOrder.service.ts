import { Injectable } from '@nestjs/common';
import DatabaseService from '../../../database/database.service';
import { OrderType, OrderStatus, User, UserType } from '@prisma/client';
import { BadRequestException } from 'src/core/exceptions/response.exception';
import CreateOrderRequestDTO from '../customer/dto/request/createOrder.request';
import NotificationService from '../notification/notification.service';
import { extractTokens } from 'src/helpers/util.helper';
import { DELIVERY_CHARGES } from 'src/constants';

interface CustomOrderEstimate {
    estimatedCost: number;
    description: string;
    customLaundryDistance: number;
    deliveryFee: number;
}

@Injectable()
export default class CustomOrderService {
    constructor(
        private _dbService: DatabaseService,
        private _notificationService: NotificationService,
    ) {}

    /**
     * Create custom order for admin review
     */
    async createCustomOrder(data: CreateOrderRequestDTO, user: User): Promise<any> {
        // Validate custom order requirements
        this.validateCustomOrderData(data);

        // Calculate estimated costs
        const estimate = await this.calculateCustomOrderEstimate(data);

        // Create order in PENDING status (awaiting admin review)
        const order = await this._dbService.order.create({
            data: {
                userId: user.id,
                orderType: OrderType.CUSTOM_LAUNDRY,

                // Custom laundry details
                customLaundryName: data.customLaundryName!,
                customLaundryDescription: data.customLaundryDescription!,
                customLaundryLat: data.customLaundryLat!,
                customLaundryLong: data.customLaundryLong!,
                customLaundryAddress: data.customLaundryAddress,

                // Pricing (preliminary)
                totalAmount: data.totalAmount || estimate.estimatedCost,
                baseAmount: data.baseAmount || estimate.estimatedCost,
                adminServiceCharge: data.adminServiceCharge,

                // Payment info
                paymentType: data.paymentType,
                status: OrderStatus.PENDING, // Awaiting admin review
                deliveryType: data.deliveryType,
                notes: data.note,

                // Customer addresses (same as regular orders)
                pickup: {
                    create: {
                        pickupAddress: data.pickupAddress,
                        pickupLat: data.pickupLat,
                        pickupLong: data.pickupLong,
                        pickupDate: data.pickupDate,
                        pickupTime: data.pickupTime,
                    },
                },
                delivery: {
                    create: {
                        deliveryAddress: data.deliveryAddress,
                        deliveryLat: data.deliveryLat,
                        deliveryLong: data.deliveryLong,
                        deliveryDate: data.deliveryDate,
                    },
                },
            },
        });

        // Notify customer about order placement
        await this.notifyCustomerOrderPlaced(user.id, order.id);

        // Notify all admins about new custom order
        await this.notifyAdminsNewCustomOrder(order.id, user);

        return {
            data: order,
            estimate: estimate,
            message: 'Custom order created successfully. Admin will review and assign a driver.',
        };
    }

    /**
     * Validate custom order data
     */
    private validateCustomOrderData(data: CreateOrderRequestDTO): void {
        if (data.orderType !== OrderType.CUSTOM_LAUNDRY) {
            throw new BadRequestException('Invalid order type for custom order creation');
        }

        const required = [
            'customLaundryName',
            'customLaundryDescription',
            'customLaundryLat',
            'customLaundryLong',
            'pickupAddress',
            'pickupLat',
            'pickupLong',
            'deliveryAddress',
            'deliveryLat',
            'deliveryLong',
        ];

        for (const field of required) {
            if (!data[field as keyof CreateOrderRequestDTO]) {
                throw new BadRequestException(`${field} is required for custom orders`);
            }
        }

        // Validate coordinates
        if (Math.abs(data.customLaundryLat!) > 90 || Math.abs(data.customLaundryLong!) > 180) {
            throw new BadRequestException('Invalid custom laundry coordinates');
        }

        if (Math.abs(data.pickupLat) > 90 || Math.abs(data.pickupLong) > 180) {
            throw new BadRequestException('Invalid pickup coordinates');
        }

        // Validate description length
        if (data.customLaundryDescription!.length < 20) {
            throw new BadRequestException('Custom laundry description must be at least 20 characters');
        }

        if (data.customLaundryDescription!.length > 1000) {
            throw new BadRequestException('Custom laundry description must be less than 1000 characters');
        }
    }

    /**
     * Calculate estimated cost for custom order
     */
    private async calculateCustomOrderEstimate(data: CreateOrderRequestDTO): Promise<CustomOrderEstimate> {
        // Calculate distance between pickup and custom laundry
        const distance = this.calculateDistance(
            data.pickupLat,
            data.pickupLong,
            data.customLaundryLat!,
            data.customLaundryLong!,
        );

        // Estimate based on distance and delivery type
        const baseEstimate = 30; // Base cost for custom orders
        const distanceMultiplier = distance * 2; // 2 SAR per km
        const deliveryFee = data.deliveryType === 'EXPRESS' ? DELIVERY_CHARGES.EXPRESS : DELIVERY_CHARGES.NORMAL;

        const estimatedCost = baseEstimate + distanceMultiplier + deliveryFee;

        return {
            estimatedCost: Math.round(estimatedCost),
            description: `Estimated cost based on ${distance.toFixed(1)}km distance to custom vendor`,
            customLaundryDistance: distance,
            deliveryFee: deliveryFee,
        };
    }

    /**
     * Calculate distance using Haversine formula
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

    /**
     * Notify customer about order placement
     */
    private async notifyCustomerOrderPlaced(userId: string, orderId: string): Promise<void> {
        const customerDeviceTokens = await this._dbService.deviceToken.findMany({
            where: { userId, deletedAt: null },
            select: { token: true },
        });

        const customerTokens = extractTokens(customerDeviceTokens);

        if (customerTokens?.length) {
            const customerNotificationData = {
                tokens: customerTokens,
                title: 'Custom Order Submitted!',
                body: 'Your custom order has been submitted and is being reviewed by our admin team.',
                notificationData: {
                    orderId: orderId,
                    key: 'FETCH_ORDERS',
                    route: 'Orders',
                },
            };

            await this._notificationService.SendNotificationToMultipleTokens(customerNotificationData);

            await this._dbService.notification.create({
                data: {
                    userId: userId,
                    orderId: orderId,
                    message: 'Your custom order has been submitted successfully.',
                    status: 'UNREAD',
                    data: {
                        orderId: orderId,
                        key: 'FETCH_ORDERS',
                        route: 'Orders',
                    },
                    type: 'ORDER_PLACED',
                },
            });
        }
    }

    /**
     * Notify all admins about new custom order
     */
    private async notifyAdminsNewCustomOrder(orderId: string, customer: User): Promise<void> {
        // Get all admin device tokens
        const adminDeviceTokens = await this._dbService.deviceToken.findMany({
            where: {
                user: { type: UserType.ADMIN },
                deletedAt: null,
            },
            select: { token: true },
        });

        const adminTokens = extractTokens(adminDeviceTokens);

        if (adminTokens?.length) {
            const adminNotificationData = {
                tokens: adminTokens,
                title: 'New Custom Order Request!',
                body: `${customer.firstName} ${customer.lastName} submitted a custom order requiring review`,
                notificationData: {
                    orderId: orderId,
                    key: 'FETCH_CUSTOM_ORDERS',
                    route: 'CustomOrders',
                },
            };

            await this._notificationService.SendNotificationToMultipleTokens(adminNotificationData);

            // Create in-app notifications for all admins
            const adminUsers = await this._dbService.user.findMany({
                where: { type: UserType.ADMIN },
                select: { id: true },
            });

            for (const admin of adminUsers) {
                await this._dbService.notification.create({
                    data: {
                        userId: admin.id,
                        orderId: orderId,
                        message: `New custom order from ${customer.firstName} ${customer.lastName} requires review`,
                        status: 'UNREAD',
                        data: {
                            orderId: orderId,
                            key: 'FETCH_CUSTOM_ORDERS',
                            route: 'CustomOrders',
                        },
                        type: 'ORDER_PLACED',
                    },
                });
            }
        }
    }

    /**
     * Get all custom orders for admin review
     */
    async getCustomOrdersForAdmin(): Promise<any> {
        const customOrders = await this._dbService.order.findMany({
            where: {
                orderType: OrderType.CUSTOM_LAUNDRY,
                deletedAt: null,
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
                pickup: {
                    select: {
                        pickupAddress: true,
                        pickupLat: true,
                        pickupLong: true,
                        pickupDate: true,
                        pickupTime: true,
                    },
                },
                delivery: {
                    select: {
                        deliveryAddress: true,
                        deliveryLat: true,
                        deliveryLong: true,
                        deliveryDate: true,
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
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return { data: customOrders };
    }

    /**
     * Get custom order details by ID
     */
    async getCustomOrderById(orderId: string): Promise<any> {
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
                pickup: true,
                delivery: true,
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
                statusHistory: {
                    orderBy: { timestamp: 'desc' },
                },
            },
        });

        if (!order) {
            throw new BadRequestException('Custom order not found');
        }

        return { data: order };
    }

    /**
     * Update custom order pricing (admin only)
     */
    async updateCustomOrderPricing(orderId: string, adminServiceCharge: number, totalAmount: number): Promise<any> {
        const order = await this._dbService.order.findUnique({
            where: {
                id: orderId,
                orderType: OrderType.CUSTOM_LAUNDRY,
            },
        });

        if (!order) {
            throw new BadRequestException('Custom order not found');
        }

        if (order.status !== OrderStatus.PENDING) {
            throw new BadRequestException('Can only update pricing for pending custom orders');
        }

        const updatedOrder = await this._dbService.order.update({
            where: { id: orderId },
            data: {
                adminServiceCharge: adminServiceCharge,
                totalAmount: totalAmount,
                baseAmount: totalAmount,
            },
        });

        return {
            data: updatedOrder,
            message: 'Custom order pricing updated successfully',
        };
    }

    /**
     * Validate custom order location (check if it's reasonable)
     */
    async validateCustomLaundryLocation(
        lat: number,
        long: number,
    ): Promise<{
        isValid: boolean;
        nearbyLaundries: any[];
        warnings: string[];
    }> {
        const warnings: string[] = [];

        // Check if coordinates are within Saudi Arabia bounds (approximate)
        const saudiaBounds = {
            minLat: 16.0,
            maxLat: 32.0,
            minLong: 34.0,
            maxLong: 56.0,
        };

        const isInSaudi =
            lat >= saudiaBounds.minLat &&
            lat <= saudiaBounds.maxLat &&
            long >= saudiaBounds.minLong &&
            long <= saudiaBounds.maxLong;

        if (!isInSaudi) {
            warnings.push('Location appears to be outside Saudi Arabia');
        }

        // Check for nearby registered laundries (might suggest using them instead)
        const nearbyLaundries = await this._dbService.laundry.findMany({
            where: {
                deletedAt: null,
            },
            select: {
                id: true,
                name: true,
                address: true,
                lat: true,
                long: true,
            },
        });

        const nearbyRegistered = nearbyLaundries.filter((laundry) => {
            const distance = this.calculateDistance(lat, long, laundry.lat, laundry.long);
            return distance <= 2; // Within 2km
        });

        if (nearbyRegistered.length > 0) {
            warnings.push(`${nearbyRegistered.length} registered laundries found within 2km`);
        }

        return {
            isValid: isInSaudi,
            nearbyLaundries: nearbyRegistered,
            warnings,
        };
    }

    /**
     * Get custom order statistics for admin dashboard
     */
    async getCustomOrderStats(): Promise<any> {
        const stats = await Promise.all([
            // Pending custom orders
            this._dbService.order.count({
                where: {
                    orderType: OrderType.CUSTOM_LAUNDRY,
                    status: OrderStatus.PENDING,
                },
            }),

            // Custom orders in progress
            this._dbService.order.count({
                where: {
                    orderType: OrderType.CUSTOM_LAUNDRY,
                    status: {
                        in: [OrderStatus.ACCEPTED, OrderStatus.IN_PROGRESS, OrderStatus.READY_FOR_PICKUP],
                    },
                },
            }),

            // Completed custom orders this month
            this._dbService.order.count({
                where: {
                    orderType: OrderType.CUSTOM_LAUNDRY,
                    status: OrderStatus.COMPLETED,
                    createdAt: {
                        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                    },
                },
            }),

            // Total custom orders
            this._dbService.order.count({
                where: {
                    orderType: OrderType.CUSTOM_LAUNDRY,
                },
            }),
        ]);

        return {
            data: {
                pending: stats[0],
                inProgress: stats[1],
                completedThisMonth: stats[2],
                total: stats[3],
            },
        };
    }

    /**
     * Search custom orders by customer phone or name
     */
    async searchCustomOrders(query: string): Promise<any> {
        const orders = await this._dbService.order.findMany({
            where: {
                orderType: OrderType.CUSTOM_LAUNDRY,
                OR: [
                    {
                        user: {
                            firstName: {
                                contains: query,
                                mode: 'insensitive',
                            },
                        },
                    },
                    {
                        user: {
                            lastName: {
                                contains: query,
                                mode: 'insensitive',
                            },
                        },
                    },
                    {
                        user: {
                            phone: {
                                contains: query,
                            },
                        },
                    },
                    {
                        customLaundryName: {
                            contains: query,
                            mode: 'insensitive',
                        },
                    },
                ],
            },
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        phone: true,
                    },
                },
                pickup: {
                    select: {
                        pickupAddress: true,
                        pickupDate: true,
                        pickupTime: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 20, // Limit results
        });

        return { data: orders };
    }
}
