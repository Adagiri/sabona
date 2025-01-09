import { BadRequestException, Injectable } from '@nestjs/common';
import DatabaseService from '../../../database/database.service';
import { OrderStatus, PaymentType, User } from '@prisma/client';
import CreateOrderRequestDTO from './dto/request/createOrder.request';
import AcceptOrderRequestDTO from '../vendor/dto/request/acceptOrder.request';
import CancelOrderResponseDTO from './dto/response/cancelOrder.response';
import { OrderListDto } from './dto/response/orderlist.response.dto';

@Injectable()
export default class CustomerService {
    constructor(private _dbService: DatabaseService) { }

    async CreateOrder(data: CreateOrderRequestDTO, user: User): Promise<any> {
        const order = await this._dbService.order.create({
            data: {
                userId: user.id,
                laundryId: data.laundryId,
                totalAmount: data.totalAmount,
                notes: data.note,
                paymentType: data.paymentType,
                status: data.paymentType === PaymentType.CASH ? OrderStatus.PENDING : OrderStatus?.PENDING_PAYMENT,
                pickup: {
                    create: {
                        pickupAddress: data.pickupAddress,
                        pickupLat: data.pickupLat,
                        pickupLong: data.pickupLong,
                        pickupDate: data.pickupDate,
                        pickupTime  : data.pickupTime,
                    }
                },
                delivery: {
                    create: {
                        deliveryAddress: data.deliveryAddress,
                        deliveryLat: data.deliveryLat,
                        deliveryLong: data.deliveryLong,
                        // deliveryTime: data.pickupTime,
                        deliveryDate: data.deliveryDate,
                    }
                },
                deliveryType: data.deliveryType,
                // detergentType: data.detergentType,
                // colorType: data.colorType,
                services: {
                    create: data.services.map(service => ({
                        laundryServiceId: service.serviceId,
                        items: {
                            create: service.items.map(item => ({
                                laundryServiceItemId: item.id,
                                quantity: item.quantity
                            }))
                        }
                    }))
                }
            }
        });

        if (!order) {
            throw new BadRequestException("Error creating order");
        }

        return { data: order };
    };


    async CancelOrder(params: AcceptOrderRequestDTO, user: User): Promise<CancelOrderResponseDTO> {
        const order = await this._dbService.order.findUnique({
            where: {
                id: params.orderId,
            },
            select: {
                status: true,
            }
        })

        if (!order) {
            throw new Error("Order does not exist");
        }

        const isUsersOrder = await this._dbService.order.findFirst({
            where: {
                id: params.orderId,
                userId: user.id
            }
        })

        if (!isUsersOrder) {
            throw new BadRequestException("Order does not belong to user");
        }

        if (order.status === 'CANCELLED') {
            throw new BadRequestException("Order already cancelled");
        }

        if (order.status !== 'PENDING') {
            throw new BadRequestException("Order cannot be cancelled");
        }

        const cancelledOrder = await this._dbService.order.update({
            where: {
                id: params.orderId,
            },
            data: {
                status: 'CANCELLED'
            },
        })

        if (!cancelledOrder) {
            throw new BadRequestException("Error cancelling the order");
        }

        const orderCancelled = await this._dbService.order.findUnique({
            where: {
                id: params.orderId,
            },
            select: {
                id: true,
                status: true,
                userId: true,
            }
        })

        return orderCancelled;

    }

    async GetOrders(user: User): Promise<OrderListDto> {
        const orders = await this._dbService.order.findMany({
            where: {
                userId: user.id,
            },
            select: {
                id: true,
                status: true,
                services: {
                    select: {
                        items: {
                            select: {
                                quantity: true,
                            },
                        },
                    },
                },
                laundry: {
                    select:{
                        name: true,
                    }
                },
            },
            orderBy:{
                createdAt: 'desc',
            }
        });

        if (!orders) {
            throw new BadRequestException("Error fetching orders");
        }
        
        const ordersWithTotalQuantity = orders.map(order => {
            const totalQuantity = order.services.reduce((orderTotal, service) => {
                const serviceTotal = service.items.reduce((itemTotal, item) => itemTotal + item.quantity, 0);
                return orderTotal + serviceTotal;
            }, 0);
        
            return {
                ...order,
                totalQuantity,
            };
        });
        
        return ordersWithTotalQuantity;
    }
}
