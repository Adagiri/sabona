import { User, UserType } from '@prisma/client';
import { ApiController, Authorized, CurrentUser, Get, Post } from '../../../core/decorators';
import { Param, Query } from '@nestjs/common';
import AdminService from './admin.service';
import { AllOrderListDto } from './dto/response/allorderlist.response.dto';
import FindUsersResponseDTO from '../user/dto/response/find.response';
import FindUsersRequestDTO from '../user/dto/request/find.request';
import FindOrderRequestDTO from './dto/request/find.request';
import FindApplicationRequestDTO from './dto/request/application.request';
import ApplicationApproveMessageResponseDTO from './dto/response/approve.response.dto';
import GetOrderByIdRequestDTO from '../order/dto/request/getOrderById.request';
import GetOrderByIdResponseDTO from '../order/dto/response/getOrderById.response';
import OrderService from '../order/order.service';
import { AllUserLocationsResponseDTO } from './dto/response/alluserlocation.response.dto';
import { UserDto } from './dto/response/userdetails.response';

@ApiController({
    path: '/admin',
    tag: 'admin',
    version: '1',
})
export default class AdminController {
    constructor(
        private _adminService: AdminService,
        private _orderService: OrderService

    ) { }

    // Get All orders
    @Authorized(UserType.ADMIN)
    @Get({
        path: '/orders/all',
        description: 'Get all orders',
        response: AllOrderListDto,
    })
    async GetAllOrders(@Query() data: FindOrderRequestDTO): Promise<AllOrderListDto> {
        return await this._adminService.GetAllOrders(data)
    }


    @Authorized(UserType.ADMIN)
    @Get({
        path: '/orders/:id',
        description: 'Get Order By Order Id',
        response: GetOrderByIdResponseDTO,
    })
    async getOrderById(@Param() params: GetOrderByIdRequestDTO): Promise<GetOrderByIdResponseDTO> {
        return await this._orderService.getOrderById(params)
    }


    // Get all user list
    @Authorized(UserType.ADMIN)
    @Get({
        path: '/users/all',
        description: 'Get users listing',
        response: FindUsersResponseDTO,
    })
    Find(@Query() data: FindUsersRequestDTO): Promise<FindUsersResponseDTO> {
        return this._adminService.Find(data);
    }


    // Get all applications
    @Authorized(UserType.ADMIN)
    @Get({
        path: '/applications',
        description: 'Get Applications listing',
        response: FindUsersResponseDTO,
    })
    async getApplications(@Query() data: FindApplicationRequestDTO): Promise<FindUsersResponseDTO> {
        return this._adminService.GetAllApplications(data);
    }


    // Approve Applications
    @Authorized(UserType.ADMIN)
    @Post({
        path: '/application/approve/:userId',
        description: 'Approve Applications',
        response: ApplicationApproveMessageResponseDTO
    })

    async approveApplication(
        @Param('userId') userId: string
    ): Promise<ApplicationApproveMessageResponseDTO> {
        return await this._adminService.ApproveApplication(userId)
    }

    @Authorized(UserType.ADMIN)
    @Get({
        path: '/users/location',
        description: 'Get Users Location',
        response: AllUserLocationsResponseDTO,
    })
    async getUsersLocation(): Promise<AllUserLocationsResponseDTO> {
        return this._adminService.GetCustomersLocation();
    }

    @Authorized(UserType.ADMIN)
    @Get({
        path: '/user-details/:userId',
        description: 'Get Users Details',
        response: UserDto,
    })
    async getUserDetails(
        @Param('userId') userId: string
    ): Promise<UserDto> {
        return this._adminService.GetUserDetails(userId);
    }
    

}