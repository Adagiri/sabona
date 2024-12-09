import { BadRequestException, Injectable } from '@nestjs/common';
import DatabaseService from '../../../database/database.service';
import { OrderStatus, User } from '@prisma/client';
import UpdateStatusRequestDTO from './dto/request/updateStatus.request';
import GetRideRequestsResponseDTO from './dto/response/getRideRequests.response';
import UpdateOrderStatusResponseDTO from './dto/response/updateOrderStatus.response';
import GetDeliveriesResponseDTO from './dto/response/getDeliveries.response';
import CancelOrderRequestDTO from './dto/request/src/modules/app/rider/dto/request/cancelOrderRequest';

@Injectable()
export default class RiderService {
    constructor(private _dbService: DatabaseService) {}

    async getRides(user: User): Promise<GetRideRequestsResponseDTO> {
        
        const rideRequests = await this._dbService.order.findMany({
            where: {
                OR: [
                    {
                        AND: [
                            {
                                OR: [
                                    { status: 'ACCEPTED' },
                                    { status: 'READY_FOR_PICKUP' }
                                ]
                            },
                            {
                                OR: [
                                    { 
                                        riderOrders: { none: { deletedAt: null } } // no rider assigned, and not deleted 
                                    },
                                    { 
                                        riderOrders: { 
                                            every: { 
                                                riderId: user.id, 
                                                deletedAt: null // current rider assigned, and not deleted 
                                            } 
                                        } 
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        riderOrders: {
                            some: {
                                riderId: user.id,
                                deletedAt: null 
                            },
                        },
                        NOT: {
                            status: {
                                in: [OrderStatus.IN_PROGRESS, OrderStatus.COMPLETED]
                            }
                        }
                    }
                ]
            },
            orderBy:{
                createdAt: 'desc'
            },
            select: {
                id: true,
                userId: true,
                laundry:{
                    select:{
                        name: true,
                        address: true,
                    }
                },
                riderOrders:{
                    select:{
                        riderId: true,
                    },
                },
                pickup:{
                    select:{
                        pickupAddress: true,
                        pickupLat: true,
                        pickupLong: true,
                        status: true,
                    }
                },
                delivery:{
                    select:{
                        deliveryAddress: true,
                        deliveryLat: true,
                        deliveryLong: true,
                        status: true,
                    }
                },
                status: true,
            }
        });

        return { data: rideRequests };
    
    }

    async updateOrderStatus(params: UpdateStatusRequestDTO, user: User): Promise<UpdateOrderStatusResponseDTO> {
        const order = await this._dbService.order.findUnique({
            where: {
                id: params.orderId
            },
            select: {
                status: true,
            }
        });
    
        if (!order) {
            throw new BadRequestException("Order does not exist");
        }

        switch (params.status) {
            case 'ACCEPT':
                const riderOrder = await this._dbService.riderOrder.create({
                    data: {
                        orderId: params.orderId,
                        riderId: user.id
                    }
                });
    
                if (!riderOrder) {
                    throw new BadRequestException("Failed to accept order");
                }

                if (order.status === 'ACCEPTED') {
                    const updatedPickup = await this._dbService.pickup.update({
                        where: {
                            orderId: params.orderId
                        },
                        data: {
                            riderId: user.id,
                            status: 'ACCEPTED'
                        }
                    });
                    if (!updatedPickup){
                        throw new BadRequestException("Error updating pickup status")
                    }
                } else if (order.status === 'READY_FOR_PICKUP') {
                    const updatedDelivery = await this._dbService.delivery.update({
                        where: {
                            orderId: params.orderId
                        },
                        data: {
                            riderId: user.id,
                            status: 'ACCEPTED'
                        }
                    });

                    if (!updatedDelivery){ 
                        throw new BadRequestException("Error updating delivery status")
                    }
                }

                return { message: 'SUCCESS' }

            case 'PICKED_UP':
                if (order.status === 'ACCEPTED') {
                    const updateStatusPickedUp = await this._dbService.pickup.update({
                        where: {
                            orderId: params.orderId
                        },
                        data: {
                            status: 'PICKED_UP'
                        }
                    });
    
                    if (!updateStatusPickedUp) {
                        throw new BadRequestException("Could not update status");
                    }
    
                    return {message: 'SUCCESS'}
                }
                else if (order.status === 'READY_FOR_PICKUP') {
                    const updateStatusPickedUpFromVendor = await this._dbService.delivery.update({
                        where: {
                            orderId: params.orderId
                        },
                        data: {
                            status: 'PICKED_UP_FROM_VENDOR'
                        }
                    });
    
                    if (!updateStatusPickedUpFromVendor) {
                        throw new BadRequestException("Could not update status");
                    }
    
                    return {message: 'SUCCESS'}
                }
               
            
            case 'DROPPED_OFF':
                if (order.status === 'ACCEPTED') {
                    const updateStatusDeliveredtoVendor = await this._dbService.pickup.update({
                        where: {
                            orderId: params.orderId
                        },
                        data: {
                            status: 'DELIVERED_TO_VENDOR'
                        }
                    });
    
                    if (!updateStatusDeliveredtoVendor) {
                        throw new BadRequestException("Could not update status");
                    }
    
                    await this._dbService.order.update({
                        where: {
                            id: params.orderId
                        },
                        data: {
                            status: 'IN_PROGRESS'
                        }
                    });
    
                    return {message: 'SUCCESS'}
    
                }
                else if (order.status === 'READY_FOR_PICKUP') {
                    const updateStatusDeliveredToUser = await this._dbService.delivery.update({
                        where: {
                            orderId: params.orderId
                        },
                        data: {
                            status: 'DELIVERED_TO_USER'
                        }
                    });
    
                    if (!updateStatusDeliveredToUser) {
                        throw new BadRequestException("Could not update status");
                    }
    
                    await this._dbService.order.update({
                        where: {
                            id: params.orderId
                        },
                        data: {
                            status: 'COMPLETED'
                        }
                    });
    
                    return {message: 'SUCCESS'}
                }
        }
    }

    async getDeliveries(user: User): Promise<GetDeliveriesResponseDTO> {
        const deliveries = await this._dbService.riderOrder.findMany({
            where: {
                riderId: user.id,
            },
            select: {
                orderId: true,
                order: {
                    select:{
                        totalAmount: true,
                        status: true,
                        user:{
                            select:{
                                firstName: true,
                                lastName: true,
                            }
                        },
                        services:{
                            select:{
                                items:{
                                    select:{
                                        quantity: true,
                                    }
                                }
                            }
                        }

                    }
                }
            },
            orderBy:{
                order: {
                    createdAt: 'desc'
                }
            }
        })

        return { data: deliveries};
    }

    async cancelOrder(params: CancelOrderRequestDTO, user: User): Promise<UpdateOrderStatusResponseDTO> {
        const orders = await this._dbService.riderOrder.findMany({
            where: {
                AND: {
                    orderId: params.orderId,
                    riderId: user.id
                },
            },
            orderBy: {
                assignedAt: 'desc'
            }
        });
    
        if (!orders || orders.length === 0) {
            throw new BadRequestException("Order does not exist");
        }

        //for the case in where same rider is assigned for pickup and dropoff
        const latestRiderOrder = orders[0];
        const riderOrderDeletion = await this._dbService.riderOrder.delete({
            where: {
                id: latestRiderOrder.id
            },
        });
        
        if (!riderOrderDeletion) {
            throw new BadRequestException("Failed to cancel order");
        }

        return {message: 'SUCCESS'}
    }

    async getCurrentOrders(user: User): Promise<GetDeliveriesResponseDTO> {
        const orders = await this._dbService.riderOrder.findMany({
            where:{
                riderId: user.id,
                order:{
                    status: {
                        in: [OrderStatus.ACCEPTED, OrderStatus.READY_FOR_PICKUP]
                    }
                }
            },
            select: {
                orderId: true,
                order: {
                    select:{
                        totalAmount: true,
                        status: true,
                        user:{
                            select:{
                                firstName: true,
                                lastName: true,
                            }
                        },
                        services:{
                            select:{
                                items:{
                                    select:{
                                        quantity: true,
                                    }
                                }
                            }
                        }

                    }
                }
            },
            orderBy:{
                order: {
                    createdAt: 'desc'
                }
            }
        })
        return { data: orders };
    }
}
