import { OrderStatus, RiderOrderType, User } from '@prisma/client';
import DatabaseService from 'src/database/database.service';
import UpdateStatusRequestDTO from './dto/request/updateStatus.request';
import GetOrderRequestsResponseDTO from './dto/response/getOrderRequests.response';
import UpdateStatusResponseDTO from './dto/response/updateStatus.response';
import { LaundryServiceDTO } from './dto/request/createLaundry.request';
import { BadRequestException } from 'src/core/exceptions/response.exception';
import { Injectable } from '@nestjs/common';
import EditLaundryRequestDTO from './dto/request/editLaundry.request';
import { CreateLaundryServiceItemsArrayDTO } from './dto/request/createLaundryServiceItem.request';
import { EditLaundryServiceItemRequestDTO } from './dto/request/editlaundryServiceItem.request';
import { GetLaundryByIdResponseDTO } from './dto/response/getLaundryById.response';
import LaundryMessageResponseDTO from './dto/response/laundryMessage';
import LaundryServiceMessageResponseDTO from './dto/response/laundryServiceMessage.response';
import GetOrderRequestDTO from './dto/request/getOrder.request';
import CancelOrderRequestDTO from './dto/request/cancelOrder.request';
import { extractTokens } from 'src/helpers/util.helper';
import NotificationService from '../notification/notification.service';
import { EditLaundryItemCategoryRequestDTO } from './dto/request/editLaundryItemCategory.request';
import {
    GetAllLaundryItemCategoriesResponseDTO,
    LaundryItemCategoryMessageResponseDTO,
    LaundryItemCategoryResponseDTO,
} from './dto/response/laundryItemCategory.response';
import { CreateLaundryItemCategoryRequestDTO } from './dto/request/createLaundryItemCategory.request';
import EditLaundryServiceRequestDTO from './dto/request/laundryServiceEdit.request';
import LocationService from '../location/location.service';
import { BooleanResponseDTO } from 'src/core/response/response.schema';
import { I18nContext, I18nService } from 'nestjs-i18n';

@Injectable()
export default class VendorService {
    private readonly locale: string;
    constructor(
        private _dbService: DatabaseService,
        private _notificationService: NotificationService,
        private _locationService: LocationService,
        private i18n: I18nService,
    ) {
        this.locale = I18nContext.current()?.lang || 'en';
    }

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
                            },
                        },
                    },
                ],
            },
            select: {
                id: true,
                userId: true,
                totalAmount: true,
                deliveryType: true,
                orderNumber: true,
                status: true,
                services: {
                    select: {
                        laundryServiceId: true,
                        laundryService: {
                            select: {
                                name: true,
                                description: true,
                            },
                        },
                        items: {
                            select: {
                                quantity: true,
                            },
                        },
                    },
                },
                vendorOrders: {
                    select: {
                        vendorId: true,
                    },
                },
            },
        });

        return { data: orderRequests };
    }

    async updateOrderStatus(params: UpdateStatusRequestDTO, user: User): Promise<UpdateStatusResponseDTO> {
        const order = await this._dbService.order.findUnique({
            where: {
                id: params.orderId,
            },
            include: {
                laundry: {
                    select: {
                        lat: true,
                        long: true,
                        vendorId: true,
                        name: true,
                    },
                },
                pickup: {
                    select: {
                        pickupLat: true,
                        pickupLong: true,
                    },
                },
            },
        });

        if (!order) {
            throw new BadRequestException('Order does not exist');
        }

        const customer = await this._dbService.order.findFirst({
            where: {
                id: params.orderId,
            },
            select: {
                userId: true,
            },
        });

        const customerDeviceTokens = await this._dbService.deviceToken.findMany({
            where: {
                userId: customer.userId,
                deletedAt: null,
            },
            select: {
                token: true,
            },
        });

        const customerTokens = extractTokens(customerDeviceTokens);

        switch (params.status) {
            case OrderStatus.ACCEPTED:
                const isOrderAlreadyAccepted = await this._dbService.order.findFirst({
                    where: {
                        AND: {
                            id: params.orderId,
                            status: {
                                not: OrderStatus.PENDING,
                            },
                        },
                    },
                });

                if (isOrderAlreadyAccepted) {
                    throw new BadRequestException('Order already accepted');
                }

                // Find closest available driver
                const closestDriver = await this._locationService.findClosestAvailableDriver(
                    order.pickup.pickupLat,
                    order.pickup.pickupLong,
                );

                if (!closestDriver) {
                    throw new BadRequestException('No available drivers found');
                }

                // Create rider assignment
                await this._dbService.riderOrder.create({
                    data: {
                        orderId: params.orderId,
                        riderId: closestDriver.riderId,
                        type: 'RIDER_PICKUP',
                    },
                });

                // Update pickup with assigned rider
                await this._dbService.pickup.update({
                    where: { orderId: params.orderId },
                    data: { riderId: closestDriver.riderId },
                });

                // Update order status to ACCEPTED
                const acceptedOrder = await this._dbService.order.update({
                    where: {
                        id: params.orderId,
                    },
                    data: {
                        status: OrderStatus.ACCEPTED,
                    },
                });

                if (!acceptedOrder) {
                    throw new BadRequestException('Failed to accept order');
                }

                // Use upsert to create or update VendorOrder with acceptedAt timestamp
                const vendorOrder = await this._dbService.vendorOrder.upsert({
                    where: {
                        orderId: params.orderId,
                    },
                    update: {
                        acceptedAt: new Date(),
                    },
                    create: {
                        orderId: params.orderId,
                        vendorId: user.id,
                        acceptedAt: new Date(),
                    },
                });

                if (!vendorOrder) {
                    throw new BadRequestException('Failed to create/update vendor order');
                }

                // Get assigned driver tokens
                const driverTokens = await this._dbService.deviceToken.findMany({
                    where: {
                        userId: closestDriver.riderId,
                        deletedAt: null,
                    },
                    select: { token: true },
                });

                const driverNotificationTokens = extractTokens(driverTokens);

                // Notify customer about acceptance
                if (customerTokens?.length) {
                    const customerAcceptedNotificationData = {
                        tokens: customerTokens,
                        title: 'Order Accepted!',
                        body: 'Your order has been accepted and a driver has been assigned.',
                        notificationData: {
                            orderId: order.id,
                            key: 'GET_ORDER_BY_ID',
                            route: 'TrackOrder',
                        },
                    };

                    const res = await this._notificationService.SendNotificationToMultipleTokens(
                        customerAcceptedNotificationData,
                    );

                    if (res) {
                        await this._dbService.notification.create({
                            data: {
                                orderId: order.id,
                                userId: customer.userId,
                                type: 'ORDER_ACCEPTED',
                                message: 'Your order has been accepted and a driver has been assigned.',
                                status: 'UNREAD',
                                data: {
                                    orderId: order.id,
                                    key: 'GET_ORDER_BY_ID',
                                    route: 'TrackOrder',
                                },
                            },
                        });
                    }
                }

                // Notify ONLY the assigned driver
                if (driverNotificationTokens?.length) {
                    const driverNotificationData = {
                        tokens: driverNotificationTokens,
                        title: 'New Pickup Assignment!',
                        body: `Order #${order.orderNumber} has been accepted - ${closestDriver.distance}km away from ${order.laundry.name}`,
                        notificationData: {
                            orderId: order.id,
                            key: 'FETCH_ASSIGNED_ORDERS',
                            route: 'AssignedRides',
                        },
                    };

                    const res =
                        await this._notificationService.SendNotificationToMultipleTokens(driverNotificationData);

                    if (res) {
                        await this._dbService.notification.create({
                            data: {
                                userId: closestDriver.riderId,
                                orderId: order.id,
                                message: `New pickup assignment - ${closestDriver.distance}km away from ${order.laundry.name}`,
                                status: 'UNREAD',
                                data: {
                                    orderId: order.id,
                                    key: 'FETCH_ASSIGNED_ORDERS',
                                    route: 'AssignedRides',
                                },
                                type: 'ORDER_ACCEPTED',
                            },
                        });
                        console.log('Driver assigned and notified');
                    } else {
                        console.log('Failed to notify driver');
                    }
                } else {
                    console.log('No driver tokens found');
                }

                return { message: 'SUCCESS' };

            case OrderStatus.REJECTED:
                const customerOrderRejectedNotificationData = {
                    tokens: customerTokens,
                    title: 'Order Rejected!',
                    // body: this.i18n.translate('order.rejected_by_vendor', { lang: this.locale }),
                    body: 'Your order has been rejected by the vendor',

                    notificationData: {
                        orderId: order.id,
                        key: 'FETCH_ORDERS',
                        route: 'Orders',
                    },
                };

                const isOrderRejected = await this._dbService.order.findFirst({
                    where: {
                        id: params.orderId,
                        status: OrderStatus.REJECTED,
                    },
                });

                if (isOrderRejected) {
                    throw new BadRequestException('order.already_rejected');
                }

                await this._dbService.order.update({
                    where: {
                        id: params.orderId,
                    },
                    data: {
                        status: OrderStatus.REJECTED,
                    },
                });

                if (customerTokens?.length) {
                    const res = await this._notificationService.SendNotificationToMultipleTokens(
                        customerOrderRejectedNotificationData,
                    );
                    if (res) {
                        await this._dbService.notification.create({
                            data: {
                                userId: customer.userId,
                                orderId: order.id,
                                // message: this.i18n.translate('order.rejected_by_vendor', { lang: this.locale }),
                                message: 'Your order has been rejected by the vendor',
                                status: 'UNREAD',
                                data: {
                                    orderId: order.id,
                                    key: 'FETCH_ORDERS',
                                    route: 'Orders',
                                },
                                type: 'ORDER_REJECTED',
                            },
                        });
                        console.log('Customer Notification created');
                    } else {
                        console.log('Failed to create notification');
                    }
                }

                return { message: 'SUCCESS' };

            case OrderStatus.READY_FOR_PICKUP:
                const isVendorsOrder = await this._dbService.vendorOrder.findFirst({
                    where: {
                        AND: {
                            orderId: params.orderId,
                            vendorId: user.id,
                        },
                    },
                });

                if (!isVendorsOrder) {
                    throw new BadRequestException('Order does not belong to vendor');
                }

                const updatedOrder = await this._dbService.order.update({
                    where: {
                        id: params.orderId,
                    },
                    data: {
                        status: OrderStatus.READY_FOR_PICKUP,
                    },
                });

                if (!updatedOrder) {
                    throw new Error('Failed to update order');
                }

                // Get the assigned driver for this order
                const closestDeliveryDriver = await this._locationService.findClosestAvailableDriver(
                    order.laundry.lat,
                    order.laundry.long,
                );

                if (!closestDeliveryDriver) {
                    throw new BadRequestException('No available drivers found for delivery');
                }

                // Create delivery assignment
                await this._dbService.riderOrder.create({
                    data: {
                        orderId: params.orderId,
                        riderId: closestDeliveryDriver.riderId,
                        type: RiderOrderType.RIDER_DELIVERY,
                    },
                });

                const assignedRider = { riderId: closestDeliveryDriver.riderId };

                // Notify customer
                if (customerTokens?.length) {
                    const customerReadyForPickupNotificationData = {
                        tokens: customerTokens,
                        title: 'Order Processed!',
                        body: 'Your order is processed and will be delivered soon.',
                        notificationData: {
                            orderId: order.id,
                            key: 'GET_ORDER_BY_ID',
                            route: 'TrackOrder',
                        },
                    };

                    const res = await this._notificationService.SendNotificationToMultipleTokens(
                        customerReadyForPickupNotificationData,
                    );
                    if (res) {
                        await this._dbService.notification.create({
                            data: {
                                userId: customer.userId,
                                orderId: order.id,
                                message: 'Your order is processed and will be delivered soon.',
                                status: 'UNREAD',
                                data: {
                                    orderId: order.id,
                                    key: 'GET_ORDER_BY_ID',
                                    route: 'TrackOrder',
                                },
                                type: 'ORDER_PROCESSING',
                            },
                        });
                        console.log('Customer Notification created');
                    } else {
                        console.log('Failed to create notification');
                    }
                }

                // Notify ONLY the assigned driver
                if (assignedRider) {
                    const assignedDriverTokens = await this._dbService.deviceToken.findMany({
                        where: {
                            userId: assignedRider.riderId,
                            deletedAt: null,
                        },
                        select: { token: true },
                    });

                    const assignedDriverNotificationTokens = extractTokens(assignedDriverTokens);

                    if (assignedDriverNotificationTokens?.length) {
                        const riderReadyForPickupNotificationData = {
                            tokens: assignedDriverNotificationTokens,
                            title: 'Order Ready for Pickup!',
                            body: `Order #${order.orderNumber} is ready for pickup from ${order.laundry.name}`,
                            notificationData: {
                                orderId: order.id,
                                key: 'FETCH_ASSIGNED_ORDERS',
                                route: 'AssignedRides',
                            },
                        };

                        const res = await this._notificationService.SendNotificationToMultipleTokens(
                            riderReadyForPickupNotificationData,
                        );
                        if (res) {
                            await this._dbService.notification.create({
                                data: {
                                    userId: assignedRider.riderId,
                                    orderId: order.id,
                                    message: `Order #${order.orderNumber} is ready for pickup`,
                                    status: 'UNREAD',
                                    data: {
                                        orderId: order.id,
                                        key: 'FETCH_ASSIGNED_ORDERS',
                                        route: 'AssignedRides',
                                    },
                                    type: 'ORDER_PROCESSING',
                                },
                            });
                            console.log('Assigned driver notified');
                        }
                    } else {
                        console.log('No assigned driver tokens found');
                    }
                } else {
                    console.log('No assigned driver found for this order');
                }

                return { message: 'SUCCESS' };

            default:
                throw new BadRequestException('Invalid order status');
        }
    }

    // async addLaundry(data: CreateLaundryRequestDTO, user: User): Promise<CreateLaundryReponseDTO> {
    //     // Validate service icons if provided
    //     if (data.services) {
    //         for (const service of data.services) {
    //             if (service.iconId) {
    //                 const icon = await this._dbService.icon.findFirst({
    //                     where: {
    //                         id: service.iconId,
    //                         deletedAt: null,
    //                         extension: 'svg',
    //                     },
    //                 });

    //                 if (!icon) {
    //                     throw new BadRequestException(`SVG icon ${service.iconId} not found or invalid format`);
    //                 }
    //             }
    //         }
    //     }

    //     const laundry = await this._dbService.laundry.create({
    //         data: {
    //             name: data.name,
    //             address: data.address,
    //             vendorId: user.id,
    //             laundryService: data.services
    //                 ? {
    //                       create: data.services.map((service) => ({
    //                           name: service.name,
    //                           description: service.description,
    //                           iconId: service.iconId,
    //                       })),
    //                   }
    //                 : undefined,
    //         },
    //         include: {
    //             laundryService: {
    //                 include: {
    //                     icon: {
    //                         select: {
    //                             id: true,
    //                             name: true,
    //                             path: true,
    //                             extension: true,
    //                         },
    //                     },
    //                 },
    //             },
    //         },
    //     });

    //     return { data: laundry };
    // }
    async getAllLaundries(): Promise<any> {
        const laundries = await this._dbService.laundry.findMany({
            where: {
                deletedAt: null,
            },
            include: {
                _count: {
                    select: {
                        laundryService: {
                            where: {
                                deletedAt: null,
                            },
                        },
                    },
                },
            },
        });

        return { data: laundries };
    }

    async getLaundryById(laundryId: string): Promise<GetLaundryByIdResponseDTO> {
        const laundry = await this._dbService.laundry.findFirst({
            where: {
                id: laundryId,
                deletedAt: null,
            },
            include: {
                vendor: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                    },
                },
                laundryService: {
                    where: {
                        deletedAt: null,
                    },
                    select: {
                        id: true,
                        name: true,
                        nameLocale: true,
                        description: true,
                        descriptionLocale: true,
                        icon: {
                            select: {
                                id: true,
                                name: true,
                                type: true,
                                createdAt: true,
                                updatedAt: true,
                                media: {
                                    select: {
                                        id: true,
                                        path: true,
                                        name: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!laundry) {
            throw new BadRequestException('Laundry does not exist');
        }

        return { data: laundry };
    }

    async editLaundry(laundryId: string, data: EditLaundryRequestDTO): Promise<LaundryMessageResponseDTO> {
        const laundry = await this._dbService.laundry.findFirst({
            where: {
                id: laundryId,
            },
            include: {
                vendor: true,
            },
        });

        if (!laundry) {
            throw new BadRequestException('Laundry does not exist');
        }

        // Use transaction to update both laundry and vendor
        await this._dbService.$transaction(async (tx) => {
            // Update laundry data
            const laundryUpdateData: any = {};

            // Handle name translation
            if (data.nameLocale) {
                laundryUpdateData.nameLocale = data.nameLocale;
                laundryUpdateData.name = data.nameLocale.en; // Auto-populate from English
            }

            // Handle address translation
            if (data.addressLocale) {
                laundryUpdateData.addressLocale = data.addressLocale;
                laundryUpdateData.address = data.addressLocale.en; // Auto-populate from English
            }

            // Handle coordinates
            if (data.lat !== undefined) {
                laundryUpdateData.lat = data.lat;
            }

            if (data.long !== undefined) {
                laundryUpdateData.long = data.long;
            }

            // Update laundry if there's data to update
            if (Object.keys(laundryUpdateData).length > 0) {
                await tx.laundry.update({
                    where: {
                        id: laundryId,
                    },
                    data: laundryUpdateData,
                });
            }

            // Update vendor data if provided
            const vendorUpdateData: any = { name: data.vendorName };

            if (data.vendorName !== undefined) {
                // Split name into firstName and lastName
                const nameParts = data.vendorName.trim().split(' ');
                if (nameParts.length === 1) {
                    vendorUpdateData.firstName = nameParts[0];
                    vendorUpdateData.lastName = '';
                } else {
                    vendorUpdateData.firstName = nameParts[0];
                    vendorUpdateData.lastName = nameParts.slice(1).join(' ');
                }
            }

            if (data.vendorEmail !== undefined) {
                // Check if email is already taken by another user
                if (data.vendorEmail !== laundry.vendor.email) {
                    const existingUser = await tx.user.findFirst({
                        where: {
                            email: data.vendorEmail,
                            id: { not: laundry.vendorId },
                        },
                    });

                    if (existingUser) {
                        throw new BadRequestException('Email is already taken by another user');
                    }
                }

                vendorUpdateData.email = data.vendorEmail;
            }

            // Update vendor if there's data to update
            if (Object.keys(vendorUpdateData).length > 0) {
                await tx.user.update({
                    where: {
                        id: laundry.vendorId,
                    },
                    data: vendorUpdateData,
                });
            }
        });

        return {
            message: 'Laundry and Vendor Updated Successfully',
        };
    }

    async deleteLaundry(laundryId: string): Promise<LaundryMessageResponseDTO> {
        const laundry = await this._dbService.laundry.findFirst({
            where: {
                id: laundryId,
            },
        });

        if (!laundry) {
            throw new BadRequestException('Laundry does not exist');
        }

        // delete all laundry services, laundry service items, laundry
        await this._dbService.laundryService.deleteMany({
            where: {
                laundryId: laundryId,
            },
        });

        await this._dbService.laundry.delete({
            where: {
                id: laundryId,
            },
        });

        return { message: 'Laundry Deleted Successfully' };
    }

    async addLaundryService(laundryId: string, data: LaundryServiceDTO): Promise<any> {
        try {
            const laundry = await this._dbService.laundry.findFirst({
                where: {
                    id: laundryId,
                },
            });

            if (!laundry) {
                throw new BadRequestException('Laundry does not exist');
            }

            // Validate icon exists if provided
            if (data.iconId) {
                const icon = await this._dbService.icon.findFirst({
                    where: {
                        id: data.iconId,
                        deletedAt: null,
                    },
                });

                if (!icon) {
                    throw new BadRequestException('Icon does not exist');
                }
            }
            console.log(data);
            const service = await this._dbService.laundryService.create({
                data: {
                    laundryId,
                    nameLocale: data?.nameLocale,
                    name: data?.nameLocale.en,
                    descriptionLocale: data?.descriptionLocale,
                    description: data?.descriptionLocale?.en,
                    iconId: data?.iconId,
                },
            });

            return {
                data: {
                    message: 'Service Added Successfully',
                    service,
                },
            };
        } catch (error) {
            console.log('error adding laundry service: ', error);
        }
    }

    async editLaundryService(
        laundryId: string,
        serviceId: string,
        data: EditLaundryServiceRequestDTO,
    ): Promise<LaundryServiceMessageResponseDTO> {
        const laundry = await this._dbService.laundry.findFirst({
            where: {
                id: laundryId,
            },
        });

        if (!laundry) {
            throw new BadRequestException('Laundry does not exist');
        }

        const service = await this._dbService.laundryService.findFirst({
            where: {
                id: serviceId,
                laundryId: laundryId,
            },
        });

        if (!service) {
            throw new BadRequestException('Service does not exist');
        }

        // Validate icon if provided
        if (data.iconId) {
            const icon = await this._dbService.icon.findFirst({
                where: {
                    id: data.iconId,
                    deletedAt: null,
                },
            });

            if (!icon) {
                throw new BadRequestException('Icon does not exist');
            }
        }

        const updateData: any = {};

        // Handle name translation
        if (data.nameLocale) {
            updateData.nameLocale = data.nameLocale;
            updateData.name = data.nameLocale.en; // Auto-populate from English
        }

        // Handle description translation
        if (data.descriptionLocale) {
            updateData.descriptionLocale = data.descriptionLocale;
            updateData.description = data.descriptionLocale.en; // Auto-populate from English
        }

        if (data.iconId !== undefined) {
            updateData.iconId = data.iconId;
        }

        await this._dbService.laundryService.update({
            where: {
                id: serviceId,
            },
            data: updateData,
        });

        return {
            message: 'Service Updated Successfully',
        };
    }

    async deleteLaundryService(laundryId: string, serviceId: string): Promise<LaundryServiceMessageResponseDTO> {
        const laundry = await this._dbService.laundry.findFirst({
            where: {
                id: laundryId,
            },
        });

        if (!laundry) {
            throw new BadRequestException('Laundry does not exist');
        }

        const service = await this._dbService.laundryService.findFirst({
            where: {
                id: serviceId,
                laundryId: laundryId,
            },
        });

        if (!service) {
            throw new BadRequestException('Service does not exist');
        }

        await this._dbService.laundryService.delete({
            where: {
                id: serviceId,
            },
        });

        return { message: 'Service Deleted Successfully' };
    }

    async addLaundryServiceItem(
        laundryId: string,
        serviceId: string,
        data: CreateLaundryServiceItemsArrayDTO,
    ): Promise<any> {
        const laundry = await this._dbService.laundry.findFirst({
            where: {
                id: laundryId,
            },
        });

        if (!laundry) {
            throw new BadRequestException('Laundry does not exist');
        }

        const service = await this._dbService.laundryService.findFirst({
            where: {
                id: serviceId,
                laundryId: laundryId,
            },
        });

        if (!service) {
            throw new BadRequestException('Service does not exist');
        }

        // Validate categories if provided
        for (const item of data.items) {
            if (item.categoryId) {
                const category = await this._dbService.laundryItemCategory.findFirst({
                    where: {
                        id: item.categoryId,
                        deletedAt: null,
                    },
                });

                if (!category) {
                    throw new BadRequestException(`Category ${item.categoryId} does not exist`);
                }
            }
        }

        const items = data.items.map((item) => ({
            nameLocale: item.nameLocale,
            name: item.nameLocale.en, // Auto-populate from English
            vendorPrice: item.vendorPrice,
            platformPrice: item.platformPrice,
            expressPrice: item.expressPrice,
            categoryId: item.categoryId,
            laundryServiceId: serviceId,
        }));

        const createdItems = await this._dbService.laundryServiceItem.createMany({
            data: items,
        });

        if (!createdItems) {
            throw new BadRequestException('Failed to add items');
        }

        return {
            data: {
                message: 'Items Added Successfully',
            },
        };
    }

    async editLaundryServiceItem(
        laundryId: string,
        serviceId: string,
        itemId: string,
        data: EditLaundryServiceItemRequestDTO,
    ): Promise<any> {
        const laundry = await this._dbService.laundry.findFirst({
            where: {
                id: laundryId,
            },
        });

        if (!laundry) {
            throw new BadRequestException('Laundry does not exist');
        }

        const service = await this._dbService.laundryService.findFirst({
            where: {
                id: serviceId,
                laundryId: laundryId,
            },
        });

        if (!service) {
            throw new BadRequestException('Service does not exist');
        }

        const item = await this._dbService.laundryServiceItem.findFirst({
            where: {
                id: itemId,
                laundryServiceId: serviceId,
                deletedAt: null,
            },
        });

        if (!item) {
            throw new BadRequestException('Item does not exist');
        }

        // Validate category if provided
        if (data.categoryId) {
            const category = await this._dbService.laundryItemCategory.findFirst({
                where: {
                    id: data.categoryId,
                    deletedAt: null,
                },
            });

            if (!category) {
                throw new BadRequestException('Category does not exist');
            }
        }

        const updateData: any = {};

        // Handle name translation
        if (data.nameLocale) {
            updateData.nameLocale = data.nameLocale;
            updateData.name = data.nameLocale.en; // Auto-populate from English
        }

        if (data.vendorPrice !== undefined) {
            updateData.vendorPrice = data.vendorPrice;
        }

        if (data.platformPrice !== undefined) {
            updateData.platformPrice = data.platformPrice;
        }

        if (data.expressPrice !== undefined) {
            updateData.expressPrice = data.expressPrice;
        }

        if (data.categoryId !== undefined) {
            updateData.categoryId = data.categoryId;
        }

        const updatedItem = await this._dbService.laundryServiceItem.update({
            where: {
                id: itemId,
            },
            data: updateData,
        });

        if (!updatedItem) {
            throw new BadRequestException('Failed to update item');
        }

        return {
            data: {
                message: 'Item Updated Successfully',
                item: updatedItem,
            },
        };
    }

    async deleteLaundryServiceItem(laundryId: string, serviceId: string, itemId: string): Promise<any> {
        const laundry = await this._dbService.laundry.findFirst({
            where: {
                id: laundryId,
            },
        });

        if (!laundry) {
            throw new BadRequestException('Laundry does not exist');
        }

        const service = await this._dbService.laundryService.findFirst({
            where: {
                id: serviceId,
                laundryId: laundryId,
            },
        });

        if (!service) {
            throw new BadRequestException('Service does not exist');
        }

        const item = await this._dbService.laundryServiceItem.findFirst({
            where: {
                id: itemId,
                laundryServiceId: serviceId,
            },
        });

        if (!item) {
            throw new BadRequestException('Item does not exist');
        }

        await this._dbService.laundryServiceItem.delete({
            where: {
                id: itemId,
            },
        });

        return { data: { message: 'Item Deleted Successfully' } };
    }

    async getAllLaundryServiceItems(laundryId: string, serviceId: string): Promise<any> {
        const laundry = await this._dbService.laundry.findFirst({
            where: {
                id: laundryId,
            },
        });

        if (!laundry) {
            throw new BadRequestException('Laundry does not exist');
        }

        const service = await this._dbService.laundryService.findFirst({
            where: {
                id: serviceId,
                laundryId: laundryId,
            },
        });

        if (!service) {
            throw new BadRequestException('Service does not exist');
        }

        const items = await this._dbService.laundryServiceItem.findMany({
            where: {
                laundryServiceId: serviceId,
                deletedAt: null,
            },
            select: {
                id: true,
                name: true,
                nameLocale: true,
                createdAt: true,
                vendorPrice: true,
                platformPrice: true,
                expressPrice: true,
                category: {
                    select: {
                        id: true,
                        name: true,
                        nameLocale: true,
                        icon: {
                            select: {
                                id: true,
                                name: true,
                                type: true,
                                media: {
                                    select: {
                                        id: true,
                                        path: true,
                                        name: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        return { data: items };
    }

    async cancelOrder(params: CancelOrderRequestDTO, user: User): Promise<UpdateStatusResponseDTO> {
        const order = await this._dbService.order.findUnique({
            where: {
                id: params.orderId,
                vendorOrders: {
                    vendorId: user.id,
                },
            },
        });

        if (!order) {
            throw new BadRequestException('Order does not exist');
        }

        const updatedOrder = await this._dbService.order.update({
            where: {
                id: params.orderId,
            },
            data: {
                status: OrderStatus.CANCELLED,
            },
        });

        if (!updatedOrder) {
            throw new BadRequestException('Failed to cancel order');
        }

        return { message: 'SUCCESS' };
    }

    async getAllOrders(user: User): Promise<any> {
        const orders = await this._dbService.order.findMany({
            where: {
                vendorOrders: {
                    vendorId: user.id,
                },
            },
        });

        console.log(orders);

        return { data: orders };
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
                createdAt: 'desc',
            },
        });

        return { data: order };
    }

    async getUserLaundry(user: User) {
        const laundry = await this._dbService.laundry.findFirst({
            where: {
                vendorId: user.id,
            },
        });

        if (!laundry) {
            throw new BadRequestException('Laundry does not exist');
        }

        return { data: laundry };
    }

    async getOrders(user: User) {
        console.log('I ran');
        console.log(user.id);
        const orders = await this._dbService.order.findMany({
            where: {
                vendorOrders: {
                    vendorId: user.id,
                },
            },
            select: {
                id: true,
                orderNumber: true,
                userId: true,
                laundryId: true,
                status: true,
                totalAmount: true,
                deliveryType: true,
                notes: true,
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                    },
                },
                vendorOrders: {
                    select: {
                        feedbacks: {
                            select: {
                                rating: true,
                                comments: true,
                            },
                        },
                    },
                },
            },
        });

        return { data: orders };
    }

    async createLaundryItemCategory(
        data: CreateLaundryItemCategoryRequestDTO,
    ): Promise<LaundryItemCategoryResponseDTO> {
        // Validate icon if provided
        if (data.iconId) {
            const icon = await this._dbService.icon.findFirst({
                where: {
                    id: data.iconId,
                    deletedAt: null,
                },
            });

            if (!icon) {
                throw new BadRequestException('Icon does not exist');
            }
        }

        const category = await this._dbService.laundryItemCategory.create({
            data: {
                nameLocale: data.nameLocale,
                name: data.nameLocale.en, // Auto-populate from English
                descriptionLocale: data.descriptionLocale,
                description: data.descriptionLocale?.en, // Auto-populate from English
                iconId: data.iconId,
            },
        });

        return category;
    }

    async getAllLaundryItemCategories(): Promise<GetAllLaundryItemCategoriesResponseDTO> {
        const categories = await this._dbService.laundryItemCategory.findMany({
            where: {
                deletedAt: null,
            },
            include: {
                icon: {
                    select: {
                        id: true,
                        name: true,
                        createdAt: true,
                        updatedAt: true,
                        type: true,
                        media: {
                            select: {
                                id: true,
                                path: true,
                                name: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        laundryServiceItems: {
                            where: { deletedAt: null },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return { data: categories };
    }

    async getLaundryItemCategoryById(categoryId: string): Promise<LaundryItemCategoryResponseDTO> {
        const category = await this._dbService.laundryItemCategory.findFirst({
            where: {
                id: categoryId,
                deletedAt: null,
            },
            include: {
                icon: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                        createdAt: true,
                        updatedAt: true,
                        media: {
                            select: {
                                id: true,
                                path: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        if (!category) {
            throw new BadRequestException('Category does not exist');
        }

        return category;
    }

    async editLaundryItemCategory(
        categoryId: string,
        data: EditLaundryItemCategoryRequestDTO,
    ): Promise<LaundryItemCategoryMessageResponseDTO> {
        const category = await this._dbService.laundryItemCategory.findFirst({
            where: {
                id: categoryId,
                deletedAt: null,
            },
        });

        if (!category) {
            throw new BadRequestException('Category does not exist');
        }

        // Validate icon if provided
        if (data.iconId) {
            const icon = await this._dbService.icon.findFirst({
                where: {
                    id: data.iconId,
                    deletedAt: null,
                },
            });

            if (!icon) {
                throw new BadRequestException('Icon does not exist');
            }
        }

        const updateData: any = {};

        // Handle name translation
        if (data.nameLocale) {
            updateData.nameLocale = data.nameLocale;
            updateData.name = data.nameLocale.en; // Auto-populate from English
        }

        // Handle description translation
        if (data.descriptionLocale) {
            updateData.descriptionLocale = data.descriptionLocale;
            updateData.description = data.descriptionLocale.en; // Auto-populate from English
        }

        if (data.iconId !== undefined) {
            updateData.iconId = data.iconId;
        }

        await this._dbService.laundryItemCategory.update({
            where: {
                id: categoryId,
            },
            data: updateData,
        });

        return {
            message: 'Category Updated Successfully',
        };
    }

    async deleteLaundryItemCategory(categoryId: string): Promise<LaundryItemCategoryMessageResponseDTO> {
        const category = await this._dbService.laundryItemCategory.findFirst({
            where: {
                id: categoryId,
                deletedAt: null,
            },
        });

        if (!category) {
            throw new BadRequestException('Category does not exist');
        }

        // Check if any items are using this category
        const itemsUsingCategory = await this._dbService.laundryServiceItem.findFirst({
            where: {
                categoryId: categoryId,
                deletedAt: null,
            },
        });

        if (itemsUsingCategory) {
            throw new BadRequestException('Cannot delete category - items are still using it');
        }

        await this._dbService.laundryItemCategory.update({
            where: {
                id: categoryId,
            },
            data: {
                deletedAt: new Date(),
            },
        });

        return { message: 'Category Deleted Successfully' };
    }

    async getLaundryServices(laundryId: string): Promise<any> {
        try {
            const laundry = await this._dbService.laundry.findUnique({
                where: { id: laundryId, deletedAt: null },
                include: {
                    vendor: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
            });

            if (!laundry) {
                throw new BadRequestException('Laundry not found');
            }

            const services = await this._dbService.laundryService.findMany({
                where: {
                    laundryId: laundryId,
                    deletedAt: null,
                },
                include: {
                    icon: {
                        select: {
                            id: true,
                            name: true,
                            type: true,
                            media: {
                                select: {
                                    id: true,
                                    path: true,
                                    name: true,
                                },
                            },
                        },
                    },
                    _count: {
                        select: {
                            laundryServiceItems: {
                                where: { deletedAt: null },
                            },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });

            return {
                success: true,
                message: 'Laundry services retrieved successfully',
                data: services,
                laundry: {
                    id: laundry.id,
                    name: laundry.name,
                    address: laundry.address,
                    vendor: laundry.vendor,
                },
            };
        } catch (error) {
            throw error;
        }
    }

    async deleteMyAccount(user: User): Promise<BooleanResponseDTO> {
        // Check for active vendor orders
        const activeOrders = await this._dbService.vendorOrder.count({
            where: {
                vendorId: user.id,
                deletedAt: null,
                order: {
                    status: {
                        in: ['ACCEPTED', 'IN_PROGRESS', 'READY_FOR_PICKUP'],
                    },
                },
            },
        });

        if (activeOrders > 0) {
            throw new BadRequestException('Cannot delete account with active orders to process');
        }

        // Check for active laundries
        const activeLaundries = await this._dbService.laundry.count({
            where: {
                vendorId: user.id,
                deletedAt: null,
            },
        });

        if (activeLaundries > 0) {
            throw new BadRequestException('Cannot delete account with active laundries. Please delete laundries first');
        }

        // Soft delete using existing middleware
        await this._dbService.user.delete({
            where: { id: user.id },
        });

        return { data: true };
    }
}
