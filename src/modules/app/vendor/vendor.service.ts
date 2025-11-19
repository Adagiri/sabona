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
import { CATEGORY_SORT_ORDER } from 'src/constants/laundry-template';

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
                    orderBy: [
                        { sortOrder: { sort: 'asc', nulls: 'last' } },
                        { name: 'asc' },
                    ],
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

        // Check for active orders (not completed, cancelled, or rejected)
        const activeOrders = await this._dbService.order.count({
            where: {
                laundryId: laundryId,
                deletedAt: null,
                status: {
                    in: ['PENDING_PAYMENT', 'PENDING', 'ACCEPTED', 'IN_PROGRESS', 'READY_FOR_PICKUP'],
                },
            },
        });

        if (activeOrders > 0) {
            throw new BadRequestException(
                `Cannot delete laundry - it has ${activeOrders} active order(s). Complete or cancel them first.`
            );
        }

        // Check for pending withdrawals
        const pendingWithdrawals = await this._dbService.withdrawalLaundry.count({
            where: {
                laundryId: laundryId,
                deletedAt: null,
                withdrawal: {
                    status: 'PENDING',
                },
            },
        });

        if (pendingWithdrawals > 0) {
            throw new BadRequestException(
                `Cannot delete laundry - it has ${pendingWithdrawals} pending withdrawal(s). Complete them first.`
            );
        }

        // Cascade soft-delete: Services and their Items
        const services = await this._dbService.laundryService.findMany({
            where: {
                laundryId: laundryId,
                deletedAt: null,
            },
            select: { id: true },
        });

        const serviceIds = services.map(s => s.id);

        // Soft delete all items in these services
        if (serviceIds.length > 0) {
            await this._dbService.laundryServiceItem.deleteMany({
                where: {
                    laundryServiceId: { in: serviceIds },
                },
            });
        }

        // Soft delete all services
        await this._dbService.laundryService.deleteMany({
            where: {
                laundryId: laundryId,
            },
        });

        // Soft delete the laundry
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

        // Check for active orders using this service
        const activeOrderServices = await this._dbService.orderLaundryService.count({
            where: {
                laundryServiceId: serviceId,
                order: {
                    deletedAt: null,
                    status: {
                        in: ['PENDING_PAYMENT', 'PENDING', 'ACCEPTED', 'IN_PROGRESS', 'READY_FOR_PICKUP'],
                    },
                },
            },
        });

        if (activeOrderServices > 0) {
            throw new BadRequestException(
                `Cannot delete service - it is used in ${activeOrderServices} active order(s). Complete or cancel them first.`
            );
        }

        // Cascade soft-delete: Items in this service
        await this._dbService.laundryServiceItem.deleteMany({
            where: {
                laundryServiceId: serviceId,
            },
        });

        // Soft delete the service
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

        // Validate categories and subcategories if provided
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

            if (item.subCategoryId) {
                const subCategory = await this._dbService.laundryItemSubCategory.findFirst({
                    where: {
                        id: item.subCategoryId,
                        deletedAt: null,
                    },
                });

                if (!subCategory) {
                    throw new BadRequestException(`Subcategory ${item.subCategoryId} does not exist`);
                }
            }
        }

        // Auto-calculate sortOrder for items that don't have it (category-scoped)
        const itemsWithSortOrder = await Promise.all(
            data.items.map(async (item) => {
                let sortOrder = item.sortOrder;

                // If sortOrder not provided, auto-calculate based on service + category
                if (sortOrder === undefined || sortOrder === null) {
                    const maxSortOrderResult = await this._dbService.laundryServiceItem.findFirst({
                        where: {
                            laundryServiceId: serviceId,
                            categoryId: item.categoryId,
                            deletedAt: null,
                        },
                        orderBy: {
                            sortOrder: 'desc',
                        },
                        select: {
                            sortOrder: true,
                        },
                    });

                    // Set sortOrder to max + 1, or 1 if no items exist in this service+category
                    sortOrder = (maxSortOrderResult?.sortOrder ?? 0) + 1;
                }

                return {
                    nameLocale: item.nameLocale,
                    name: item.nameLocale.en, // Auto-populate from English
                    vendorPrice: item.vendorPrice,
                    platformPrice: item.platformPrice,
                    expressVendorPrice: item.expressVendorPrice,
                    expressPlatformPrice: item.expressPlatformPrice,
                    categoryId: item.categoryId,
                    subCategoryId: item.subCategoryId,
                    sortOrder: sortOrder,
                    laundryServiceId: serviceId,
                };
            }),
        );

        const createdItems = await this._dbService.laundryServiceItem.createMany({
            data: itemsWithSortOrder,
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

        // Validate subcategory if provided
        if (data.subCategoryId) {
            const subCategory = await this._dbService.laundryItemSubCategory.findFirst({
                where: {
                    id: data.subCategoryId,
                    deletedAt: null,
                },
            });

            if (!subCategory) {
                throw new BadRequestException('Subcategory does not exist');
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

        if (data.expressVendorPrice !== undefined) {
            updateData.expressVendorPrice = data.expressVendorPrice;
        }

        if (data.expressPlatformPrice !== undefined) {
            updateData.expressPlatformPrice = data.expressPlatformPrice;
        }

        if (data.categoryId !== undefined) {
            updateData.categoryId = data.categoryId;
        }

        if (data.subCategoryId !== undefined) {
            updateData.subCategoryId = data.subCategoryId;
        }

        if (data.sortOrder !== undefined) {
            updateData.sortOrder = data.sortOrder;
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

        // Check for active orders containing this item
        const activeOrderItems = await this._dbService.orderLaundryServiceItem.count({
            where: {
                laundryServiceItemId: itemId,
                orderLaundryService: {
                    order: {
                        deletedAt: null,
                        status: {
                            in: ['PENDING_PAYMENT', 'PENDING', 'ACCEPTED', 'IN_PROGRESS', 'READY_FOR_PICKUP'],
                        },
                    },
                },
            },
        });

        if (activeOrderItems > 0) {
            throw new BadRequestException(
                `Cannot delete item - it is in ${activeOrderItems} active order(s). Complete or cancel them first.`
            );
        }

        // Safe to soft delete
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
                expressVendorPrice: true,
                expressPlatformPrice: true,
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
            orderBy: {
                sortOrder: 'asc',
            },
        });

        // Add expressPrice for backward compatibility
        const itemsWithExpressPrice = items.map(item => ({
            ...item,
            expressPrice: item.expressVendorPrice,
        }));

        return { data: itemsWithExpressPrice };
    }

    async getLaundryServiceItemsByCategory(laundryId: string, serviceId: string, categoryId: string): Promise<any> {
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

        const category = await this._dbService.laundryItemCategory.findFirst({
            where: {
                id: categoryId,
                deletedAt: null,
            },
        });

        if (!category) {
            throw new BadRequestException('Category does not exist');
        }

        const items = await this._dbService.laundryServiceItem.findMany({
            where: {
                laundryServiceId: serviceId,
                categoryId: categoryId,
                deletedAt: null,
            },
            select: {
                id: true,
                name: true,
                nameLocale: true,
                createdAt: true,
                vendorPrice: true,
                platformPrice: true,
                expressVendorPrice: true,
                expressPlatformPrice: true,
                sortOrder: true,
                categoryId: true,
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
            orderBy: {
                sortOrder: 'asc',
            },
        });

        // Add expressPrice for backward compatibility
        const itemsWithExpressPrice = items.map(item => ({
            ...item,
            expressPrice: item.expressVendorPrice,
        }));

        return { data: itemsWithExpressPrice };
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
        });

        // Sort categories by custom sort order
        const sortedCategories = categories.sort((a, b) => {
            const orderA = CATEGORY_SORT_ORDER[a.name] || 999;
            const orderB = CATEGORY_SORT_ORDER[b.name] || 999;
            return orderA - orderB;
        });

        return { data: sortedCategories };
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
            // Validate category name against allowed names
            const allowedCategoryNames = Object.keys(CATEGORY_SORT_ORDER);
            if (!allowedCategoryNames.includes(data.nameLocale.en)) {
                throw new BadRequestException(
                    `Category name must be one of: ${allowedCategoryNames.join(', ')}`
                );
            }

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

        // Check if any active items are using this category
        const itemsUsingCategory = await this._dbService.laundryServiceItem.count({
            where: {
                categoryId: categoryId,
                deletedAt: null,
            },
        });

        if (itemsUsingCategory > 0) {
            throw new BadRequestException(
                `Cannot delete category - ${itemsUsingCategory} item(s) are still using it.`
            );
        }

        // Check for active subcategories
        const activeSubcategories = await this._dbService.laundryItemSubCategory.count({
            where: {
                categoryId: categoryId,
                deletedAt: null,
            },
        });

        if (activeSubcategories > 0) {
            throw new BadRequestException(
                `Cannot delete category - it has ${activeSubcategories} active subcategory/subcategories. Delete subcategories first.`
            );
        }

        // Safe to soft delete
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
                orderBy: {
                    sortOrder: 'asc',
                },
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

    async getItemsByCategory(categoryId: string): Promise<any> {
        // Verify category exists
        const category = await this._dbService.laundryItemCategory.findFirst({
            where: {
                id: categoryId,
                deletedAt: null,
            },
        });

        if (!category) {
            throw new BadRequestException('Category not found');
        }

        // Fetch all items under this category
        const items = await this._dbService.laundryServiceItem.findMany({
            where: {
                categoryId: categoryId,
                deletedAt: null,
            },
            include: {
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
                subCategory: {
                    select: {
                        id: true,
                        name: true,
                        nameLocale: true,
                    },
                },
            },
            orderBy: [
                {
                    sortOrder: { sort: 'asc', nulls: 'last' },
                },
                {
                    name: 'asc',
                },
            ],
        });

        // Add expressPrice for backward compatibility
        const itemsWithExpressPrice = items.map(item => ({
            ...item,
            expressPrice: item.expressVendorPrice,
        }));

        return { data: itemsWithExpressPrice };
    }

    // Reorder Laundry Services
    async reorderLaundryServices(laundryId: string, serviceIds: string[]): Promise<{ success: boolean; message: string }> {
        // Verify laundry exists
        const laundry = await this._dbService.laundry.findFirst({
            where: { id: laundryId, deletedAt: null },
        });

        if (!laundry) {
            throw new BadRequestException('Laundry not found');
        }

        // Verify all services belong to this laundry
        const services = await this._dbService.laundryService.findMany({
            where: {
                id: { in: serviceIds },
                laundryId: laundryId,
                deletedAt: null,
            },
        });

        if (services.length !== serviceIds.length) {
            throw new BadRequestException('Some services do not belong to this laundry');
        }

        // Update sortOrder for each service
        const updatePromises = serviceIds.map((serviceId, index) => {
            return this._dbService.laundryService.update({
                where: { id: serviceId },
                data: { sortOrder: index + 1 },
            });
        });

        await Promise.all(updatePromises);

        return {
            success: true,
            message: 'Services reordered successfully',
        };
    }

    // Reorder Laundry Service Items (category-scoped)
    async reorderLaundryServiceItems(
        laundryId: string,
        serviceId: string,
        categoryId: string,
        itemIds: string[],
    ): Promise<{ success: boolean; message: string }> {
        // Verify laundry exists
        const laundry = await this._dbService.laundry.findFirst({
            where: { id: laundryId, deletedAt: null },
        });

        if (!laundry) {
            throw new BadRequestException('Laundry not found');
        }

        // Verify service belongs to laundry
        const service = await this._dbService.laundryService.findFirst({
            where: {
                id: serviceId,
                laundryId: laundryId,
                deletedAt: null,
            },
        });

        if (!service) {
            throw new BadRequestException('Service not found or does not belong to this laundry');
        }

        // Verify category exists
        const category = await this._dbService.laundryItemCategory.findFirst({
            where: { id: categoryId, deletedAt: null },
        });

        if (!category) {
            throw new BadRequestException('Category not found');
        }

        // Verify all items belong to this service + category
        const items = await this._dbService.laundryServiceItem.findMany({
            where: {
                id: { in: itemIds },
                laundryServiceId: serviceId,
                categoryId: categoryId,
                deletedAt: null,
            },
        });

        if (items.length !== itemIds.length) {
            throw new BadRequestException('Some items do not belong to this service and category');
        }

        // Update sortOrder for each item (scoped to service + category)
        const updatePromises = itemIds.map((itemId, index) => {
            return this._dbService.laundryServiceItem.update({
                where: { id: itemId },
                data: { sortOrder: index + 1 },
            });
        });

        await Promise.all(updatePromises);

        return {
            success: true,
            message: 'Items reordered successfully',
        };
    }

    // Change Single Service Order Position
    async changeLaundryServiceOrder(
        laundryId: string,
        serviceId: string,
        newPosition: number,
    ): Promise<{ success: boolean; message: string }> {
        // Verify laundry exists
        const laundry = await this._dbService.laundry.findFirst({
            where: { id: laundryId, deletedAt: null },
        });

        if (!laundry) {
            throw new BadRequestException('Laundry not found');
        }

        // Get the service
        const service = await this._dbService.laundryService.findFirst({
            where: {
                id: serviceId,
                laundryId: laundryId,
                deletedAt: null,
            },
        });

        if (!service) {
            throw new BadRequestException('Service not found or does not belong to this laundry');
        }

        // Get all services for this laundry (ordered)
        const allServices = await this._dbService.laundryService.findMany({
            where: {
                laundryId: laundryId,
                deletedAt: null,
            },
            orderBy: {
                sortOrder: 'asc',
            },
        });

        if (newPosition < 1 || newPosition > allServices.length) {
            throw new BadRequestException(`Position must be between 1 and ${allServices.length}`);
        }

        // Find current position
        const currentIndex = allServices.findIndex((s) => s.id === serviceId);
        if (currentIndex === -1) {
            throw new BadRequestException('Service not found in list');
        }

        const currentPosition = currentIndex + 1; // 1-indexed

        if (currentPosition === newPosition) {
            return {
                success: true,
                message: 'Service is already at this position',
            };
        }

        // Reorder the array
        const updatedServices = [...allServices];
        const [movedService] = updatedServices.splice(currentIndex, 1);
        updatedServices.splice(newPosition - 1, 0, movedService);

        // Update all sortOrders
        const updatePromises = updatedServices.map((svc, index) => {
            return this._dbService.laundryService.update({
                where: { id: svc.id },
                data: { sortOrder: index + 1 },
            });
        });

        await Promise.all(updatePromises);

        return {
            success: true,
            message: `Service moved from position ${currentPosition} to ${newPosition}`,
        };
    }

    // Change Single Item Order Position (Category-Scoped)
    async changeLaundryServiceItemOrder(
        laundryId: string,
        serviceId: string,
        categoryId: string,
        itemId: string,
        newPosition: number,
    ): Promise<{ success: boolean; message: string }> {
        // Verify laundry exists
        const laundry = await this._dbService.laundry.findFirst({
            where: { id: laundryId, deletedAt: null },
        });

        if (!laundry) {
            throw new BadRequestException('Laundry not found');
        }

        // Verify service belongs to laundry
        const service = await this._dbService.laundryService.findFirst({
            where: {
                id: serviceId,
                laundryId: laundryId,
                deletedAt: null,
            },
        });

        if (!service) {
            throw new BadRequestException('Service not found or does not belong to this laundry');
        }

        // Verify category exists
        const category = await this._dbService.laundryItemCategory.findFirst({
            where: { id: categoryId, deletedAt: null },
        });

        if (!category) {
            throw new BadRequestException('Category not found');
        }

        // Get all items for this service + category (ordered)
        const allItems = await this._dbService.laundryServiceItem.findMany({
            where: {
                laundryServiceId: serviceId,
                categoryId: categoryId,
                deletedAt: null,
            },
            orderBy: {
                sortOrder: 'asc',
            },
        });

        if (allItems.length === 0) {
            throw new BadRequestException('No items found for this service and category');
        }

        if (newPosition < 1 || newPosition > allItems.length) {
            throw new BadRequestException(`Position must be between 1 and ${allItems.length}`);
        }

        // Find current position
        const currentIndex = allItems.findIndex((item) => item.id === itemId);
        if (currentIndex === -1) {
            throw new BadRequestException('Item not found in this service and category');
        }

        const currentPosition = currentIndex + 1; // 1-indexed

        if (currentPosition === newPosition) {
            return {
                success: true,
                message: 'Item is already at this position',
            };
        }

        // Reorder the array
        const updatedItems = [...allItems];
        const [movedItem] = updatedItems.splice(currentIndex, 1);
        updatedItems.splice(newPosition - 1, 0, movedItem);

        // Update all sortOrders
        const updatePromises = updatedItems.map((item, index) => {
            return this._dbService.laundryServiceItem.update({
                where: { id: item.id },
                data: { sortOrder: index + 1 },
            });
        });

        await Promise.all(updatePromises);

        return {
            success: true,
            message: `Item moved from position ${currentPosition} to ${newPosition}`,
        };
    }
}
