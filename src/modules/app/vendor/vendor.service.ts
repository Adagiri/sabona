import { BadRequestException, Injectable } from "@nestjs/common";
import { User } from "@prisma/client";
import DatabaseService from "src/database/database.service";
import AcceptOrderRequestDTO from "./dto/request/acceptOrder.request";
import UpdateStatusRequestDTO from "./dto/request/updateStatus.request";
import GetOrderRequestsResponseDTO from "./dto/response/getOrderRequests.response";
import UpdateStatusResponseDTO from "./dto/response/updateStatus.response";

@Injectable()
export default class VendorService {
    constructor(private _dbService: DatabaseService) {}

    async getOrderRequests(): Promise<GetOrderRequestsResponseDTO> {
        const orderRequests = await this._dbService.order.findMany({
            where: {
                status: 'PENDING',
            },
            select: {
                id: true,
                userId: true,
                totalAmount: true,
                pickup: {
                    select: {
                        id: true,
                        pickupAddress: true,
                        pickupLat: true,
                        pickupLong: true,
                    }
                },
                delivery: {
                    select: {
                        id: true,
                        deliveryAddress: true,
                        deliveryLat: true,
                        deliveryLong: true,
                    }
                },
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                    }
                }
            }   
        })

        return {data:orderRequests};
    }

    async updateOrderStatus(params: UpdateStatusRequestDTO, user: User): Promise<UpdateStatusResponseDTO> {
        const order = await this._dbService.order.findUnique({
            where: {
                id: params.orderId,
            },
        })

        if (!order){
            throw new BadRequestException("Order does not exist")
        }

        switch(params.status){
            case 'ACCEPTED':
                const isOrderAlreadyAccepted = await this._dbService.order.findFirst({
                    where: {
                        AND: {
                            id: params.orderId,
                            status:{
                                not: 'PENDING'
                            }
                        }
                    }
                })

                if (isOrderAlreadyAccepted){
                    throw new BadRequestException("Order already accepted")
                }

                const acceptedOrder = await this._dbService.order.update({
                    where: {
                        id: params.orderId
                    },
                    data: {
                        status: 'ACCEPTED',
                        // vendorOrders: {
                        //     create: {
                        //         vendorId: user.id,
                        //     }
                        // }
                    }
                })

                if (!acceptedOrder){
                    throw new BadRequestException("Failed to accept order")
                }

                const vendorOrder = await this._dbService.vendorOrder.create({
                    data: {
                        orderId: params.orderId,
                        vendorId: user.id,
                    }
                })

                if (!vendorOrder){
                    throw new BadRequestException("Failed to accept order")
                }

                return {message: 'SUCCESS'}

                case 'READY_FOR_PICKUP':
                    const isVendorsOrder = await this._dbService.vendorOrder.findFirst({
                        where: {
                            AND: {
                                orderId: params.orderId,
                                vendorId: user.id,
                            }
                        }
                    })

                    if (!isVendorsOrder){
                        throw new BadRequestException("Order does not belong to vendor")
                    }

                    const updatedOrder = await this._dbService.order.update({
                        where: {
                            id: params.orderId,
                        },
                        data: {
                            status: 'READY_FOR_PICKUP',
                        }
                    })

                    if (!updatedOrder){
                        throw new Error("Failed to update order")
                    }

                    return {message: 'SUCCESS'}
        }
        
    }
}