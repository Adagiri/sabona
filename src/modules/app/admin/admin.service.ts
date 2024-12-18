import { Injectable } from '@nestjs/common';
import DatabaseService from '../../../database/database.service';
import { OrderListDto } from '../customer/dto/response/orderlist.response.dto';
import { AllOrderListDto } from './dto/response/allorderlist.response.dto';
import { AllUserListDto } from './dto/response/allCustomerList.response.dto';
import FindUsersRequestDTO from '../user/dto/request/find.request';
import FindUsersResponseDTO from '../user/dto/response/find.response';
import { Prisma, UserStatus, UserType } from '@prisma/client';
import { GetOrderOptions, GetPaginationOptions } from 'src/helpers/util.helper';
import FindOrderRequestDTO from './dto/request/find.request';
import FindApplicationRequestDTO from './dto/request/application.request';
import { BadRequestException } from 'src/core/exceptions/response.exception';
import ApplicationApproveMessageResponseDTO from './dto/response/approve.response.dto';

@Injectable()
export default class AdminService {
    constructor(private _dbService: DatabaseService) { }

    async GetAllOrders(data: FindOrderRequestDTO): Promise<AllOrderListDto> {

        const where: Prisma.OrderWhereInput = {
            ...(!!data.type && { status: data.type }), // Only include 'status' condition if it exists
        };

        // Get pagination and order options
        const pagination = GetPaginationOptions(data);
        const order = GetOrderOptions(data);

        // Fetch orders with filtering, pagination, and ordering
        const orders = await this._dbService.order.findMany({
            where,
            select: {
                id: true,
                status: true,
                user:{
                    select:{
                        firstName: true,
                        lastName: true,
                    }
                },
                totalAmount: true,
                riderOrders:{
                    select:{
                        rider:{
                            select:{
                                firstName: true,
                                lastName: true,
                            }
                        }
                    }
                },
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
                    select: {
                        name: true,
                    },
                },
            },
            ...pagination,
            orderBy: order,
        });

        if (!orders) {
            throw new BadRequestException('Error fetching orders');
        }

        // Calculate totalQuantity for each order
        const ordersWithTotalQuantity = orders.map((order) => {
            const totalQuantity = order.services.reduce((orderTotal, service) => {
                const serviceTotal = service.items.reduce(
                    (itemTotal, item) => itemTotal + item.quantity,
                    0,
                );
                return orderTotal + serviceTotal;
            }, 0);

            return {
                ...order,
                totalQuantity,
            };
        });

        // Count total number of orders matching the condition
        const count = await this._dbService.order.count({
            where,
        });

        return { data: ordersWithTotalQuantity, count };
    }

    async Find(data: FindUsersRequestDTO): Promise<FindUsersResponseDTO> {
        const where: Prisma.UserWhereInput = {
            ...(!!data.type && { type: data.type }),
        };
        const pagination = GetPaginationOptions(data);
        const order = GetOrderOptions(data);

        const users = await this._dbService.user.findMany({
            select:{
                id: true,
                firstName: true,
                lastName : true,
                email: true,
                type: true,
                phone: true,
                createdAt: true,
                updatedAt: true,
                status: true,
            },
            where,
            ...pagination,
            orderBy: order,
        });

        const count = await this._dbService.user.count({
            where,
        });

        return { data: users, count };
    }

    async GetAllApplications(data: FindApplicationRequestDTO): Promise<FindUsersResponseDTO> {
        const where: Prisma.UserWhereInput = {
            ...(!!data.type && { type: data.type }),
            ...({ status: UserStatus.INACTIVE }),
        };
        const pagination = GetPaginationOptions(data);
        const order = GetOrderOptions(data);

        const applications = await this._dbService.user.findMany({
            select:{
                id: true,
                firstName: true,
                lastName : true,
                email: true,
                phone: true,
                createdAt: true,
                updatedAt: true,
                status: true,
                type: true,
            },
            where,
            ...pagination,
            orderBy: order,
        });

        const count = await this._dbService.user.count({
            where,
        });

        return { data: applications, count };
    }

    async ApproveApplication(userId: string): Promise<ApplicationApproveMessageResponseDTO> {
        

        const user = await this._dbService.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException('User not found');
        }

        if (user.status !== UserStatus.INACTIVE) {
            throw new BadRequestException('Application is already approved');
        }


        await this._dbService.user.update({
            where: { id: userId },
            data: { status: UserStatus.ACTIVE },
        });

        return { message: 'Application approved successfully' };
    }
}

