import { BadRequestException, Injectable } from '@nestjs/common';
import DatabaseService from '../../../database/database.service';
import { User } from '@prisma/client';
import CreateOrderRequestDTO from './dto/request/createOrder.request';
import GetAllCustomerOrdersResponseDTO from './dto/response/getAllCustomerOrders';
import GetOrderByIdRequestDTO from './dto/request/getOrderById.request';
import AcceptOrderRequestDTO from '../vendor/dto/request/acceptOrder.request';
import CancelOrderResponseDTO from './dto/response/cancelOrder.response';

@Injectable()
export default class CustomerService {
    constructor(private _dbService: DatabaseService) {}

    // async CreateOrder(data: CreateOrderRequestDTO, user: User): Promise<any> {
    //     const order = await this._dbService.order.create({
    //         data: {
    //             userId: user.id.toString(),
    //             totalAmount: data.totalAmount,
    //         }
    //     })

    //     if (!order) {
    //         throw new Error("Order not created");
    //     }

    //     const pickupEntry = await this._dbService.pickup.create({
    //         data: {
    //             orderId: order.id,
    //             pickupAddress: data.pickupAddress,
    //             pickupLat: data.pickupLat,
    //             pickupLong: data.pickupLong,
    //         }
    //     })

    //     if (!pickupEntry) {
    //         throw new Error("Pickup entry not created");
    //     }

    //     const deliveryEntry = await this._dbService.delivery.create({
    //         data: {
    //             orderId: order.id,
    //             deliveryAddress: data.deliveryAddress,
    //             deliveryLat: data.deliveryLat,
    //             deliveryLong: data.deliveryLong,
    //         }
    //     })

    //     if (!deliveryEntry) {
    //         throw new Error("Delivery entry not created");
    //     }

    //     return { data: order };
    // }

    async GetAllOrders(user: User): Promise<GetAllCustomerOrdersResponseDTO> { 
        const orders = await this._dbService.order.findMany({
            where: {
                userId: user.id
            },
            select: {
                id: true,
                userId: true,
                status: true,
                totalAmount: true,
                createdAt: true,
                updatedAt: true
            }
        });
    
        return { data: orders }; 
    }

    async GetOrderById(params: GetOrderByIdRequestDTO): Promise<any> {

        const order = await this._dbService.order.findUnique({
            where: {
                id: params.id.toString(),
            },
            select: {
                id: true,
                userId: true,
                status: true,
                totalAmount: true,
                createdAt: true,
                updatedAt: true,
                riderOrders: {
                    select: {
                        id: true,
                        riderId: true,
                        assignedAt: true,
                    }
                },
                vendorOrders: {
                    select:{
                        vendorId: true,
                        acceptedAt: true,
                    }
                },
                statusHistory: {
                    select: {
                        status: true,
                        timestamp: true
                    }
                },
                pickup: {
                    select: {
                        riderId: true,
                        pickupAddress: true,
                        pickupLat: true,
                        pickupLong: true,
                        status: true,
                        
                    }
                },
                delivery: {
                    select:{
                        riderId: true,
                        deliveryAddress: true,
                        deliveryLat: true,
                        deliveryLong: true,
                        status: true,
                    }
                }

            }
        })

        return {data: order};
    }


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
}
