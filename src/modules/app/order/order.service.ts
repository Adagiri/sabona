import { Injectable } from "@nestjs/common";
import DatabaseService from "src/database/database.service";
import { BadRequestException } from "src/core/exceptions/response.exception";
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
                                        vendorPrice: true, // NEW: Use dual pricing
                                        platformPrice: true, // NEW: Use dual pricing
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

        return { data: order };
    }
}