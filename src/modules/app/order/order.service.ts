import {  Injectable } from "@nestjs/common";
import DatabaseService from "src/database/database.service";
import getOrderByIdRequestDTO from "./dto/request/getOrderById.request";
import GetOrderByIdResponseDTO from "./dto/response/getOrderById.response";
import { BadRequestException } from "src/core/exceptions/response.exception";
@Injectable()
export default class OrderService {
    constructor(private _dbService: DatabaseService) {}
    async getOrderById(params: getOrderByIdRequestDTO): Promise<GetOrderByIdResponseDTO> {
        const order = await this._dbService.order.findUnique({
            where: {
                id: params.id
            },
            select:{
                id: true,
                totalAmount: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                laundryId: true,
                laundry:{
                    select:{
                        id: true,
                        name: true,
                        address: true,
                        laundryService:{
                            select:{
                                id: true,
                                name: true,
                                description: true,
                                laundryServiceItems:{
                                    select:{
                                        id: true,
                                        name: true,
                                        price: true,
                                    }
                                }
                            }
                        }
                    }
                },
                riderOrders: {
                    select: {
                        riderId: true,
                        assignedAt: true,
                    },
                },
                statusHistory: {
                    select: {
                        status: true,
                        timestamp: true,
                    },
                },
                pickup: {
                    select: {
                        riderId: true,
                        pickupAddress: true,
                        pickupLat: true,
                        pickupLong: true,
                        status: true,
                        pickupDate: true,
                        pickupTime: true,
                    },
                },
                delivery: {
                    select: {
                        riderId: true,
                        deliveryAddress: true,
                        deliveryLat: true,
                        deliveryLong: true,
                        status: true,
                        deliveryDate: true,
                        deliveryTime: true,
                    },
                },
                services: {
                    select: {
                        id: true,
                        items:{
                            select:{
                                id: true,
                                quantity: true,
                                laundryServiceItem:{
                                    select:{
                                        id: true,
                                        name: true,
                                        price: true,
                                    }
                                },
                                laundryServiceItemId: true,
                            },
                        },
                        laundryServiceId: true,
                        laundryService:{
                            select:{
                                name: true,
                                description: true,
                            }
                        }
                    },
                }
            }
        })
        if (!order) {
            throw new BadRequestException("Order not found");
        }
        return order;
    }

   
}