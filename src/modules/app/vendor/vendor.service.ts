import { OrderStatus, User, UserType } from "@prisma/client";
import DatabaseService from "src/database/database.service";
import UpdateStatusRequestDTO from "./dto/request/updateStatus.request";
import GetOrderRequestsResponseDTO from "./dto/response/getOrderRequests.response";
import UpdateStatusResponseDTO from "./dto/response/updateStatus.response";
import CreateLaundryRequestDTO, { LaundryServiceDTO } from "./dto/request/createLaundry.request";
import { BadRequestException } from "src/core/exceptions/response.exception";
import { Injectable } from "@nestjs/common";
import EditLaundryRequestDTO from "./dto/request/editLaundry.request";
import {  CreateLaundryServiceItemsArrayDTO } from "./dto/request/createLaundryServiceItem.request";
import { EditLaundryServiceItemRequestDTO } from "./dto/request/editlaundryServiceItem.request";
import { CreateLaundryReponseDTO } from "./dto/response/createLaundry.response";
import { GetAllLaundriesResponseDTO } from "./dto/response/getAllLaundry.response";
import { GetLaundryByIdResponseDTO } from "./dto/response/getLaundryById.response";
import LaundryMessageResponseDTO from "./dto/response/laundryMessage";
import LaundryServiceMessageResponseDTO from "./dto/response/laundryServiceMessage.response";
import GetOrderRequestDTO from "./dto/request/getOrder.request";
import CancelOrderRequestDTO from "./dto/request/cancelOrder.request";
import { extractTokens } from "src/helpers/util.helper";
import NotificationService from "../notification/notification.service";
@Injectable()
export default class VendorService {
    constructor(
        private _dbService: DatabaseService,
        private _notificationService: NotificationService,
    ) { }

    async getOrderRequests(user: User, param: GetOrderRequestDTO): Promise<GetOrderRequestsResponseDTO> {
        const orderRequests = await this._dbService.order.findMany({
            where: {
                    OR: [
                    {
                        laundryId: param.laundryId,
                        status: OrderStatus.IN_PROGRESS,
                    },
                    {
                        laundryId: param.laundryId,
                        status: OrderStatus.PENDING,
                    },
                    {
                        laundryId: param.laundryId,
                        status: OrderStatus.ACCEPTED,
                    },
                    {
                        AND: {
                            status: OrderStatus.ACCEPTED,
                            vendorOrders: {
                                vendorId: user.id,
                            }
                        }
                    },
                ],
            },
            select: {
                id: true,
                userId: true,
                totalAmount: true,
                deliveryType: true,
                orderNumber:true,
                services: {
                    select: {
                        laundryServiceId: true,
                        laundryService: {
                            select: {
                                name: true,
                                description: true,
                            }
                        },
                        items: {
                            select: {
                                quantity: true,
                            }
                        }
                    },
                },
                vendorOrders: {
                    select: {
                        vendorId: true,
                    }
                }
            }
        })

        return { data: orderRequests };
    }

    async updateOrderStatus(params: UpdateStatusRequestDTO, user: User): Promise<UpdateStatusResponseDTO> {
        const order = await this._dbService.order.findUnique({
            where: {
                id: params.orderId,
            },
        })

        if (!order) {
            throw new BadRequestException("Order does not exist")
        }


        const customer = await this._dbService.order.findFirst({
            where: {
                id: params.orderId,
            },
            select: {
                userId: true,
            }
        })


        const customerDeviceTokens = await this._dbService.user.findMany({
            where: {
                id: customer.userId,
                DeviceToken: { some: { token: { not: "" } } }
            },
            select: {
                DeviceToken: {
                    select: {
                        token: true,
                    },
                },
            },
        });

        const riderDeviceTokens = await this._dbService.user.findMany({
            where: {
                type: UserType.RIDER,
                DeviceToken: { some: { token: { not: "" } } }
            },
            select: {
                DeviceToken: {
                    select: {
                        token: true,
                    },
                },
            },
        });

        const customerTokens = extractTokens(customerDeviceTokens);
        const riderTokens = extractTokens(riderDeviceTokens);

        switch (params.status) {
            case OrderStatus.ACCEPTED:
                const isOrderAlreadyAccepted = await this._dbService.order.findFirst({
                    where: {
                        AND: {
                            id: params.orderId,
                            status: {
                                not: OrderStatus.PENDING,
                            }
                        }
                    }
                })

                if (isOrderAlreadyAccepted) {
                    throw new BadRequestException("Order already accepted")
                }

                const acceptedOrder = await this._dbService.order.update({
                    where: {
                        id: params.orderId
                    },
                    data: {
                        status: OrderStatus.ACCEPTED,
                        // vendorOrders: {
                        //     create: {
                        //         vendorId: user.id,
                        //     }
                        // }
                    }
                })

                if (!acceptedOrder) {
                    throw new BadRequestException("Failed to accept order")
                }

                const vendorOrder = await this._dbService.vendorOrder.create({
                    data: {
                        orderId: params.orderId,
                        vendorId: user.id,
                    }
                })

                if (!vendorOrder) {
                    throw new BadRequestException("Failed to accept order")
                }

                const customerAcceptedNotificationData = {
                    tokens: customerTokens,
                    title: "Order Accepted!!",
                    body: "Your order has been accepted successfully.",
                    notificationData: {
                        orderId: order.id,
                        key: 'GET_ORDER_BY_ID',
                        route: 'TrackOrder',
                    },
                };

                const riderAcceptedNotificationData = {
                    tokens: riderTokens,
                    title: "New Order!!",
                    body: "You have recieved a new order.",
                    notificationData: {
                        orderId: order.id,
                        key: 'FETCH_RIDER_REQUESTS',
                        route: 'Home',
                    }
                };

                if (customerTokens?.length) {
                    const res = await this._notificationService.SendNotificationToMultipleTokens(customerAcceptedNotificationData);
                    if (res) {
                        const createNotification = await this._dbService.notification.create({
                            data: {
                                orderId: order.id,
                                userId: customer.userId,
                                type: "ORDER_ACCEPTED",
                                message: "Your order has been accepted successfully.",
                                status: "UNREAD",
                                data: {
                                    orderId: order.id,
                                    key: 'FETCH_RIDER_REQUESTS',
                                    route: 'Home',
                                },
                            }
                        })
                        if (createNotification) {
                            console.log("Notification created")
                        }
                        else {
                            console.log("Failed to create notification")
                        }
                    }
                }
                if (riderTokens?.length) {
                    const res = await this._notificationService.SendNotificationToMultipleTokens(riderAcceptedNotificationData);
                    if(res){
                        console.log("Rider notified")
                    }
                
                }
                else {
                    console.log("No rider to notify")
                }
                return { message: 'SUCCESS' }

            case OrderStatus.READY_FOR_PICKUP:

                const customerReadyForPickupNotificationData = {
                    tokens: customerTokens,
                    title: "Order Processed!!",
                    body: "Your order is processed and will be delivered soon.",
                    notificationData: {
                        orderId: order.id,
                        key: 'GET_ORDER_BY_ID',
                        route: 'TrackOrder',
                    }
                };

                const riderReadyForPickupNotificationData = {
                    tokens: riderTokens,
                    title: "New Order!!",
                    body: "You have recieved a new order.",
                    notificationData: {
                        orderId: order.id,
                        key: 'FETCH_RIDER_REQUESTS',
                        route: 'Home',
                    }
                };

                const isVendorsOrder = await this._dbService.vendorOrder.findFirst({
                    where: {
                        AND: {
                            orderId: params.orderId,
                            vendorId: user.id,
                        }
                    }
                })

                if (!isVendorsOrder) {
                    throw new BadRequestException("Order does not belong to vendor")
                }

                const updatedOrder = await this._dbService.order.update({
                    where: {
                        id: params.orderId,
                    },
                    data: {
                        status: OrderStatus.READY_FOR_PICKUP,
                    }
                })

                if (!updatedOrder) {
                    throw new Error("Failed to update order")
                }
                if (customerTokens?.length) {
                    const res = await this._notificationService.SendNotificationToMultipleTokens(customerReadyForPickupNotificationData);
                    if (res) {
                        const createNotification = await this._dbService.notification.create({
                            data: {
                                userId: customer.userId,
                                orderId: order.id,
                                message: "Your order is processed and will be delivered soon.",
                                status: "UNREAD",
                                data: {
                                    orderId: order.id,
                                    key: 'GET_ORDER_BY_ID',
                                    route: 'TrackOrder',
                                },
                                type: "ORDER_PROCESSING",
                            }
                        });
                        if (createNotification) {
                            console.log("Customer Notification created")
                        }
                        else {
                            console.log("Failed to create notification")
                        }
                    }
                }
                if(riderTokens?.length) {
                   const res = await this._notificationService.SendNotificationToMultipleTokens(riderReadyForPickupNotificationData);
                   if(res){
                          console.log("Rider notified")
                   }
                }

                return { message: 'SUCCESS' }
        }

    }

    async addLaundry(data: CreateLaundryRequestDTO, user: User): Promise<CreateLaundryReponseDTO> {
        const laundry = await this._dbService.laundry.findFirst({
            where: {
                vendorId: user.id,
                deletedAt: null,
            }
        })

        if (laundry) {
            throw new BadRequestException("Laundry already exist")
        }

        const newLaundry = await this._dbService.laundry.create({
            data: {
                name: data.name,
                address: data.address,
                vendorId: user.id,
                ...(data.services && data.services.length > 0 && {
                    laundryService: {
                        create: data.services.map(service => ({
                            name: service.name,
                            description: service.description,
                        }))
                    }
                })
            },
            include: {
                laundryService: true
            }
        })

        if (!newLaundry) {
            throw new BadRequestException("Failed to add laundry")
        }

        return { data: newLaundry }
    }

    async getAllLaundries(): Promise<GetAllLaundriesResponseDTO> {
        const laundries = await this._dbService.laundry.findMany({
            select: {
                id: true,
                name: true,
                address: true,
                vendor:{
                    select:{
                        addresses:{
                            select:{
                                lat:true,
                                long:true
                            }
                        }      
                    }
                },
                laundryService: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                    }
                }
            }
        })

        if (!laundries) {
            throw new BadRequestException("Error fetching laundries")
        }

        return { data: laundries }
    }

    async getLaundryById(laundryId: string, user: User): Promise<GetLaundryByIdResponseDTO> {
        const laundry = await this._dbService.laundry.findFirst({
            where: {
                id: laundryId,
                // vendorId: user.id,
            },
            select: {
                id: true,
                name: true,
                address: true,
                laundryService: {
                    where: {
                        deletedAt: null,
                    },
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        laundryServiceItems: {
                            select: {
                                name: true,
                                price: true,
                            }
                        }
                    }
                }
            }
        })

        if (!laundry) {
            throw new BadRequestException("Laundry does not exist")
        }

        return { data: laundry }
    }

    async editLaundry(laundryId: string, data: EditLaundryRequestDTO, user: User): Promise<LaundryMessageResponseDTO> {
        const laundry = await this._dbService.laundry.findFirst({
            where: {
                id: laundryId,
                vendorId: user.id,
            }
        })

        if (!laundry) {
            throw new BadRequestException("Laundry does not exist")
        }

        const updatedLaundry = await this._dbService.laundry.update({
            where: {
                id: laundryId,
            },
            data: {
                name: data.name,
                address: data.address,
            }
        })

        if (!updatedLaundry) {
            throw new BadRequestException("Failed to update laundry")
        }

        return { message: 'Laundry Updated Successfully' }
    }

    async deleteLaundry(laundryId: string, user: User): Promise<LaundryMessageResponseDTO> {
        const laundry = await this._dbService.laundry.findFirst({
            where: {
                id: laundryId,
                vendorId: user.id,
            }
        })

        if (!laundry) {
            throw new BadRequestException("Laundry does not exist")
        }

        // delete all laundry services, laundry service items, laundry
        await this._dbService.laundryService.deleteMany({
            where: {
                laundryId: laundryId
            }
        })

        await this._dbService.laundry.delete({
            where: {
                id: laundryId,
            }
        })

        return { message: 'Laundry Deleted Successfully' }
    }

    async addLaundryService(laundryId: string, data: LaundryServiceDTO, user: User): Promise<any> {
        const laundry = await this._dbService.laundry.findFirst({
            where: {
                id: laundryId,
                vendorId: user.id,
            }
        })

        if (!laundry) {
            throw new BadRequestException("Laundry does not exist")
        }

        const service = await this._dbService.laundryService.create({
            data: {
                laundryId: laundryId,
                name: data.name,
                description: data.description,
            }
        })


        return service;
    }

    async editLaundryService(laundryId: string, serviceId: string, data: LaundryServiceDTO, user: User): Promise<LaundryServiceMessageResponseDTO> {
        const laundry = await this._dbService.laundry.findFirst({
            where: {
                id: laundryId,
                vendorId: user.id,
            }
        })

        if (!laundry) {
            throw new BadRequestException("Laundry does not exist")
        }

        const service = await this._dbService.laundryService.findFirst({
            where: {
                id: serviceId,
                laundryId: laundryId,
            }
        })

        if (!service) {
            throw new BadRequestException("Service does not exist")
        }

        const updatedService = await this._dbService.laundryService.update({
            where: {
                id: serviceId,
            },
            data: {
                name: data.name,
                description: data.description,
            }
        })

        if (!updatedService) {
            throw new BadRequestException("Failed to update service")
        }

        return { message: 'Service Updated Successfully' };
    }

    async deleteLaundryService(laundryId: string, serviceId: string, user: User): Promise<LaundryServiceMessageResponseDTO> {
        const laundry = await this._dbService.laundry.findFirst({
            where: {
                id: laundryId,
                vendorId: user.id,
            }
        })

        if (!laundry) {
            throw new BadRequestException("Laundry does not exist")
        }

        const service = await this._dbService.laundryService.findFirst({
            where: {
                id: serviceId,
                laundryId: laundryId,
            }
        })

        if (!service) {
            throw new BadRequestException("Service does not exist")
        }

        await this._dbService.laundryService.delete({
            where: {
                id: serviceId,
            }
        })

        return { message: 'Service Deleted Successfully' };
    }

    async addLaundryServiceItem(laundryId: string, serviceId: string, data: CreateLaundryServiceItemsArrayDTO, user: User): Promise<any> {
        const laundry = await this._dbService.laundry.findFirst({
            where: {
                id: laundryId,
                vendorId: user.id,
            }
        })

        if (!laundry) {
            throw new BadRequestException("Laundry does not exist")
        }

        const service = await this._dbService.laundryService.findFirst({
            where: {
                id: serviceId,
                laundryId: laundryId,
            }
        })

        if (!service) {
            throw new BadRequestException("Service does not exist")
        }

        const items = data.items.map(item => ({
            name: item.name,
            price: item.price,
            laundryServiceId: serviceId,
        }))

        const createdItems = await this._dbService.laundryServiceItem.createMany({
            data: items
        })

        if (!createdItems) {
            throw new BadRequestException("Failed to add items")
        }

        return { data: { message: 'Items Added Successfully' } }
    }

    async getAllLaundryServiceItems(laundryId: string, serviceId: string, user: User): Promise<any> {
        const laundry = await this._dbService.laundry.findFirst({
            where: {
                id: laundryId,
                // vendorId: user.id,
            },
        })

        if (!laundry) {
            throw new BadRequestException("Laundry does not exist")
        }

        const service = await this._dbService.laundryService.findFirst({
            where: {
                id: serviceId,
                laundryId: laundryId,
            },
        })

        if (!service) {
            throw new BadRequestException("Service does not exist")
        }

        const items = await this._dbService.laundryServiceItem.findMany({
            where: {
                laundryServiceId: serviceId,
                deletedAt: null,
            },
            select: {
                id: true,
                name: true,
                price: true
            }
        })

        return { data: items }
    }

    async editLaundryServiceItem(laundryId: string, serviceId: string, itemId: string, data: EditLaundryServiceItemRequestDTO, user: User): Promise<any> {
        const laundry = await this._dbService.laundry.findFirst({
            where: {
                id: laundryId,
                vendorId: user.id,
            }
        })

        if (!laundry) {
            throw new BadRequestException("Laundry does not exist")
        }

        const service = await this._dbService.laundryService.findFirst({
            where: {
                id: serviceId,
                laundryId: laundryId,
            }
        })

        if (!service) {
            throw new BadRequestException("Service does not exist")
        }

        const item = await this._dbService.laundryServiceItem.findFirst({
            where: {
                id: itemId,
                laundryServiceId: serviceId,
            }
        })

        if (!item) {
            throw new BadRequestException("Item does not exist")
        }

        const updatedItem = await this._dbService.laundryServiceItem.update({
            where: {
                id: itemId,
            },
            data: {
                name: data.name,
                price: data.price,
            }
        })

        if (!updatedItem) {
            throw new BadRequestException("Failed to update item")
        }

        return { data: { message: 'Item Updated Successfully' } };
    }

    async deleteLaundryServiceItem(laundryId: string, serviceId: string, itemId: string, user: User): Promise<any> {
        const laundry = await this._dbService.laundry.findFirst({
            where: {
                id: laundryId,
                vendorId: user.id,
            }
        })

        if (!laundry) {
            throw new BadRequestException("Laundry does not exist")
        }

        const service = await this._dbService.laundryService.findFirst({
            where: {
                id: serviceId,
                laundryId: laundryId,
            }
        })

        if (!service) {
            throw new BadRequestException("Service does not exist")
        }

        const item = await this._dbService.laundryServiceItem.findFirst({
            where: {
                id: itemId,
                laundryServiceId: serviceId,
            }
        })

        if (!item) {
            throw new BadRequestException("Item does not exist")
        }

        await this._dbService.laundryServiceItem.delete({
            where: {
                id: itemId,
            }
        })

        return { data: { message: 'Item Deleted Successfully' } };
    }

    async cancelOrder(params: CancelOrderRequestDTO, user: User): Promise<UpdateStatusResponseDTO> {
        console.log("params", params)
        const order = await this._dbService.order.findUnique({
            where: {
                id: params.orderId,
                vendorOrders: {
                    vendorId: user.id,
                }
            }
        })

        if (!order) {
            throw new BadRequestException("Order does not exist")
        }

        const updatedOrder = await this._dbService.order.update({
            where: {
                id: params.orderId,
            },
            data: {
                status: OrderStatus.CANCELLED,
            }
        })

        if (!updatedOrder) {
            throw new BadRequestException("Failed to cancel order")
        }

        return { message: 'SUCCESS' }
    }

    async getAllOrders(user: User): Promise<any> {
        const orders = await this._dbService.order.findMany({
            where: {
                vendorOrders: {
                    vendorId: user.id,
                }
            }
        })

        console.log(orders)

        return { data: orders }
    }

    async getLastCompletedOrder(user: User) {
        const order = await this._dbService.order.findFirst({
            where: {
                vendorOrders: {
                    vendorId: user.id,
                },
                status: OrderStatus.COMPLETED,
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return { data: order }
    }

    async getUserLaundry(user: User) {
        const laundry = await this._dbService.laundry.findFirst({
            where: {
                vendorId: user.id,
            }
        })

        if (!laundry) {
            throw new BadRequestException("Laundry does not exist")
        }

        return { data: laundry }
    }

    async getOrders(user: User) {
        const orders = await this._dbService.order.findMany({
            where: {
                vendorOrders: {
                    vendorId: user.id,
                },
            },
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                    }
                }
            }
        })

        return { data: orders }
    }
}