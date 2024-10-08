import { BadRequestException, Injectable } from '@nestjs/common';
import DatabaseService from '../../../database/database.service';
import AcceptPickupRequestDTO from './dto/request/acceptPickupReuest.request';
import { User } from '@prisma/client';
import { stat } from 'fs';
import GetOrderByIdRequestDTO from '../customer/dto/request/getOrderById.request';
import UpdateStatusRequestDTO from './dto/request/updateStatus.request';
import GetRideRequestsResponseDTO from './dto/response/getRideRequests.response';
import UpdateOrderStatusResponseDTO from './dto/response/updateOrderStatus.response';
import GetDeliveriesResponseDTO from './dto/response/getDeliveries.response';

@Injectable()
export default class RiderService {
    constructor(private _dbService: DatabaseService) {}

    async getRideRequests(user: User): Promise<GetRideRequestsResponseDTO> {
        
        const rideRequests = await this._dbService.order.findMany({
            where: {
                OR:[
                    {status: 'ACCEPTED'},
                    {status: 'READY_FOR_PICKUP'}
                ]
                
            },
            select: {
                id: true,
                userId: true,
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
                            riderId: user.id
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
                            riderId: user.id
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


    async getOrderById(params: GetOrderByIdRequestDTO, user: User): Promise<any> {
        
        const riderOrder = await this._dbService.riderOrder.findFirst({
            where: {
                AND:{
                    orderId: params.id,
                    riderId: user.id
                }
            },
        })

        if (riderOrder){
            
            const order = await this._dbService.order.findUnique({
                where:{
                    id: params.id
                },
                select:{
                    id: true,
                    userId: true,
                    status: true,
                    totalAmount: true,
                    createdAt: true,
                    updatedAt: true,
                    pickup: {
                        select:{
                            id: true,
                            status: true,
                            pickupAddress: true,
                            pickupLat: true,
                            pickupLong: true,
                            riderId: true
                        }
                    },
                    delivery: {
                        select:{
                            id: true,
                            status: true,
                            deliveryAddress: true,
                            deliveryLat: true,
                            deliveryLong: true,
                            riderId: true
                        }
                    },
                    vendorOrders: {
                        select: {
                            vendor: {
                                select: {
                                    id: true,
                                    addresses: {
                                        select:{
                                            address: true,
                                            lat: true,
                                            long: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            })

            const isPickup = order.pickup.riderId === user.id;
            const isDelivery = order.delivery.riderId === user.id;

            if (isPickup) {
                return {
                orderId: order.id,
                userId: order.userId,
                status: order.status,
                totalAmount: order.totalAmount,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt,
                pickupAddress: order.pickup.pickupAddress, 
                pickupLat: order.pickup.pickupLat,
                pickupLong: order.pickup.pickupLong,
                deliveryAddress: order.vendorOrders.vendor.addresses[0].address,
                deliveryLat: order.vendorOrders.vendor.addresses[0].lat,
                deliveryLong: order.vendorOrders.vendor.addresses[0].long}
            } else if (isDelivery) {
                return {
                orderId: order.id,
                userId: order.userId,
                status: order.status,
                totalAmount: order.totalAmount,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt,
                pickupAddress: order.vendorOrders.vendor.addresses[0].address,
                pickupLat: order.vendorOrders.vendor.addresses[0].lat,
                pickupLong: order.vendorOrders.vendor.addresses[0].long,
                deliveryAddress: order.delivery.deliveryAddress,
                deliveryLat: order.delivery.deliveryLat,
                deliveryLong: order.delivery.deliveryLong
                }
            }

        }else {
                const order = await this._dbService.order.findUnique({
                    where:{
                        id: params.id
                    },
                    select:{
                        id: true,
                        userId: true,
                        status: true,
                        totalAmount: true,
                        createdAt: true,
                        updatedAt: true,
                    }
                })
                return order;
        }
       
    }

    async getDeliveries(user: User): Promise<GetDeliveriesResponseDTO> {
        const deliveries = await this._dbService.riderOrder.findMany({
            where: {
                riderId: user.id
            },
            select: {
                orderId: true,
                order: {
                    select:{
                        totalAmount: true,
                    }
                }
            }
        })

        return { data: deliveries};
    }
}
