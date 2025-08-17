import { User, UserType } from '@prisma/client';
import { ApiController, Authorized, CurrentUser, Delete, Get, Patch, Post } from '../../../core/decorators';
import { Body, Param, Query } from '@nestjs/common';
import AdminService from './admin.service';
import { AllOrderListDto } from './dto/response/allorderlist.response.dto';
import FindUsersResponseDTO from '../user/dto/response/find.response';
import FindUsersRequestDTO from '../user/dto/request/find.request';
import FindOrderRequestDTO from './dto/request/find.request';
import FindApplicationRequestDTO, { AdminSearchMainVendorsRequestDTO, UploadApplicationDocumentsRequestDTO } from './dto/request/application.request';
import ApplicationApproveMessageResponseDTO from './dto/response/approve.response.dto';
import GetOrderByIdRequestDTO from '../order/dto/request/getOrderById.request';
import GetOrderByIdResponseDTO from '../order/dto/response/getOrderById.response';
import OrderService from '../order/order.service';
import { AllUserLocationsResponseDTO } from './dto/response/alluserlocation.response.dto';
import { CreateCouponRequest } from './dto/request/createCoupon.request';
import { CreateCouponResponseDTO } from './dto/response/createCoupon.response';
import { GetAllCouponsResponseArrayDTO, GetAllCouponsResponseDTO } from './dto/response/getAllCoupons.response';
import PaginatedRequest from 'src/core/request/paginated.request';
import { CouponUsagePaginatedResponseDTO } from './dto/response/couponUsage.response';

import { UserDto } from './dto/response/userdetails.response';
import { SlotRequest } from '../customer/dto/request/slotRequest';
import { AllTipsResponseDTO } from './dto/response/allTips.response';
import { ApproveApplicationRequestDTO, RejectApplicationRequestDTO } from './dto/request/application.request';
import {
    ApplicationRejectMessageResponseDTO,
    UploadApplicationDocumentsResponseDTO,
} from './dto/response/application.response';
import { ApplicationDocumentsResponseDTO, MainVendorSearchResultDTO, VendorBranchesResponseDTO } from './dto/response/vendor.response';

import VendorService from '../vendor/vendor.service';
import { LaundryServiceDTO } from '../vendor/dto/request/createLaundry.request';
import EditLaundryRequestDTO from '../vendor/dto/request/editLaundry.request';
import EditLaundryServiceRequestDTO from '../vendor/dto/request/laundryServiceEdit.request';
import { CreateLaundryServiceItemsArrayDTO } from '../vendor/dto/request/createLaundryServiceItem.request';
import { EditLaundryServiceItemRequestDTO } from '../vendor/dto/request/editlaundryServiceItem.request';
import { GetAllLaundriesResponseDTO } from '../vendor/dto/response/getAllLaundry.response';
import { GetLaundryByIdResponseDTO } from '../vendor/dto/response/getLaundryById.response';
import LaundryMessageResponseDTO from '../vendor/dto/response/laundryMessage';
import LaundryServiceMessageResponseDTO from '../vendor/dto/response/laundryServiceMessage.response';
import { CreateLaundryItemCategoryRequestDTO } from '../vendor/dto/request/createLaundryItemCategory.request';
import { EditLaundryItemCategoryRequestDTO } from '../vendor/dto/request/editLaundryItemCategory.request';
import {
    LaundryItemCategoryResponseDTO,
    GetAllLaundryItemCategoriesResponseDTO,
    LaundryItemCategoryMessageResponseDTO,
} from '../vendor/dto/response/laundryItemCategory.response';


@ApiController({
    path: '/admin',
    tag: 'admin',
    version: '1',
})
export default class AdminController {
    constructor(
        private _adminService: AdminService,
        private _orderService: OrderService,
        private _vendorService: VendorService,
    ) {}

    // Get All orders
    @Authorized(UserType.ADMIN)
    @Get({
        path: '/orders/all',
        description: 'Get all orders',
        response: AllOrderListDto,
    })
    async GetAllOrders(@Query() data: FindOrderRequestDTO): Promise<AllOrderListDto> {
        return await this._adminService.GetAllOrders(data);
    }

    @Authorized(UserType.ADMIN)
    @Get({
        path: '/orders/:id',
        description: 'Get Order By Order Id',
        response: GetOrderByIdResponseDTO,
    })
    async getOrderById(@Param() params: GetOrderByIdRequestDTO): Promise<GetOrderByIdResponseDTO> {
        return await this._orderService.getOrderById(params);
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

    @Authorized(UserType.ADMIN)
    @Post({
        path: '/application/documents/:userId',
        description: 'Upload VAT and business certificate documents for approved vendor',
        response: UploadApplicationDocumentsResponseDTO,
    })
    async uploadApplicationDocuments(
        @Param('userId') userId: string,
        @Body() data: UploadApplicationDocumentsRequestDTO,
    ): Promise<UploadApplicationDocumentsResponseDTO> {
        return this._adminService.uploadApplicationDocuments(userId, data);
    }

    @Authorized(UserType.ADMIN)
    @Get({
        path: '/application/documents/:userId',
        description: 'Get application documents',
        response: ApplicationDocumentsResponseDTO,
    })
    async getApplicationDocuments(@Param('userId') userId: string): Promise<ApplicationDocumentsResponseDTO> {
        return this._adminService.getApplicationDocuments(userId);
    }

    @Authorized(UserType.ADMIN)
    @Get({
        path: '/main-vendors/search',
        description: 'Search existing main vendors by laundry name for branch linking',
        response: [MainVendorSearchResultDTO],
    })
    async searchMainVendors(@Query() data: AdminSearchMainVendorsRequestDTO): Promise<MainVendorSearchResultDTO[]> {
        console.log(data);
        return this._adminService.searchMainVendors(data);
    }

    @Authorized(UserType.ADMIN)
    @Get({
        path: 'mainVendor/:mainVendorId/branches',
        description: 'Get all branches of a main vendor',
        response: VendorBranchesResponseDTO,
    })
    async getSubVendorsForMainVendor(@Param('mainVendorId') mainVendorId: string): Promise<VendorBranchesResponseDTO> {
        return this._adminService.getSubVendorsForMainVendor(mainVendorId);
    }

    // Approve Applications
    @Authorized(UserType.ADMIN)
    @Post({
        path: '/application/approve/:userId',
        description: 'Approve Applications',
        response: ApplicationApproveMessageResponseDTO,
    })
    async approveApplication(
        @Param('userId') userId: string,
        @Body() data: ApproveApplicationRequestDTO,
    ): Promise<ApplicationApproveMessageResponseDTO> {
        return await this._adminService.ApproveApplication(userId, data);
    }

    @Authorized(UserType.ADMIN)
    @Post({
        path: '/application/reject/:userId',
        description: 'Reject vendor signup with reason',
        response: ApplicationRejectMessageResponseDTO,
    })
    async rejectApplication(
        @Param('userId') userId: string,
        @Body() data: RejectApplicationRequestDTO,
    ): Promise<ApplicationRejectMessageResponseDTO> {
        return this._adminService.RejectApplication(userId, data);
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
    @Post({
        path: '/create/coupon',
        description: 'Create Coupon',
        response: CreateCouponResponseDTO,
    })
    async createCoupon(@Body() data: CreateCouponRequest): Promise<CreateCouponResponseDTO> {
        return this._adminService.createCoupon(data);
    }

    @Authorized(UserType.ADMIN)
    @Get({
        path: '/coupons/all',
        description: 'Get All Coupons',
        response: GetAllCouponsResponseArrayDTO,
    })
    async getCoupons(@Query() data: PaginatedRequest): Promise<GetAllCouponsResponseDTO[]> {
        return this._adminService.getCoupons(data);
    }

    @Authorized(UserType.ADMIN)
    @Get({
        path: '/coupons/:id/usage',
        description: 'Get Coupon Usage By Id',
        response: CouponUsagePaginatedResponseDTO,
    })
    async getCouponUsage(
        @Param('id') id: string,
        @Query() data: PaginatedRequest,
    ): Promise<CouponUsagePaginatedResponseDTO> {
        return this._adminService.getCouponUsage(id, data);
    }
    @Get({
        path: '/user-details/:userId',
        description: 'Get Users Details',
        response: UserDto,
    })
    async getUserDetails(@Param('userId') userId: string): Promise<UserDto> {
        return this._adminService.GetUserDetails(userId);
    }

    @Get({
        path: '/driver-tips/:userId',
        description: 'Get Driver Tips',
        response: {},
    })
    async getDriverTips(@Param('userId') userId: string, @Query() data: SlotRequest): Promise<any> {
        return this._adminService.GetDriverTips(userId, data);
    }

    @Get({
        path: '/tips/all',
        description: 'Get All Tips',
        response: AllTipsResponseDTO,
    })
    async getAllTips(@Query() data: PaginatedRequest): Promise<AllTipsResponseDTO> {
        return this._adminService.GetAllTips(data);
    }

    @Authorized(UserType.ADMIN)
    @Get({
        path: '/laundries',
        description: 'Get all laundries',
        response: GetAllLaundriesResponseDTO,
    })
    async getAllLaundries(): Promise<GetAllLaundriesResponseDTO> {
        return await this._vendorService.getAllLaundries();
    }

    @Authorized(UserType.ADMIN)
    @Get({
        path: '/laundry/:laundryId',
        description: 'Get laundry by id',
        response: GetLaundryByIdResponseDTO,
    })
    async getLaundryById(@Param('laundryId') laundryId: string): Promise<GetLaundryByIdResponseDTO> {
        return await this._vendorService.getLaundryById(laundryId);
    }

    @Authorized(UserType.ADMIN)
    @Patch({
        path: '/laundry/:laundryId/edit',
        description: 'Edit laundry',
        response: LaundryMessageResponseDTO,
    })
    async editLaundry(
        @Param('laundryId') laundryId: string,
        @Body() data: EditLaundryRequestDTO,
        @CurrentUser() user: User,
    ): Promise<LaundryMessageResponseDTO> {
        return await this._vendorService.editLaundry(laundryId, data, user);
    }

    @Authorized(UserType.ADMIN)
    @Delete({
        path: '/laundry/:laundryId/delete',
        description: 'Delete laundry',
        response: LaundryMessageResponseDTO,
    })
    async deleteLaundry(
        @Param('laundryId') laundryId: string,
        @CurrentUser() user: User,
    ): Promise<LaundryMessageResponseDTO> {
        return await this._vendorService.deleteLaundry(laundryId, user);
    }

    // Laundry Service Management

    @Authorized(UserType.ADMIN)
    @Post({
        path: '/laundry/:laundryId/service/create',
        description: 'Add laundry service',
        response: {},
    })
    async addLaundryService(
        @Param('laundryId') laundryId: string,
        @Body() data: LaundryServiceDTO,
        @CurrentUser() user: User,
    ): Promise<any> {
        return await this._vendorService.addLaundryService(laundryId, data, user);
    }

    @Authorized(UserType.ADMIN)
    @Get({
        path: '/laundry/:laundryId/services',
        description: 'Get all services for a laundry',
        response: {},
    })
    async getLaundryServices(@Param('laundryId') laundryId: string): Promise<any> {
        // You'll need to add this method to vendor service
        return await this._vendorService.getLaundryServices(laundryId);
    }

    @Authorized(UserType.ADMIN)
    @Patch({
        path: '/laundry/:laundryId/service/:serviceId/edit',
        description: 'Edit laundry service',
        response: LaundryServiceMessageResponseDTO,
    })
    async editLaundryService(
        @Param('laundryId') laundryId: string,
        @Param('serviceId') serviceId: string,
        @Body() data: EditLaundryServiceRequestDTO,
        @CurrentUser() user: User,
    ): Promise<LaundryServiceMessageResponseDTO> {
        return await this._vendorService.editLaundryService(laundryId, serviceId, data, user);
    }

    @Authorized(UserType.ADMIN)
    @Delete({
        path: '/laundry/:laundryId/service/:serviceId/delete',
        description: 'Delete laundry service',
        response: LaundryServiceMessageResponseDTO,
    })
    async deleteLaundryService(
        @Param('laundryId') laundryId: string,
        @Param('serviceId') serviceId: string,
        @CurrentUser() user: User,
    ): Promise<LaundryServiceMessageResponseDTO> {
        return await this._vendorService.deleteLaundryService(laundryId, serviceId, user);
    }

    // Laundry Service Item Management

    @Authorized(UserType.ADMIN)
    @Post({
        path: '/laundry/:laundryId/service/:serviceId/item',
        description: 'Add laundry service item',
        response: {},
    })
    async addLaundryServiceItem(
        @Param('laundryId') laundryId: string,
        @Param('serviceId') serviceId: string,
        @Body() data: CreateLaundryServiceItemsArrayDTO,
        @CurrentUser() user: User,
    ): Promise<any> {
        return await this._vendorService.addLaundryServiceItem(laundryId, serviceId, data, user);
    }

    @Authorized(UserType.ADMIN)
    @Get({
        path: '/laundry/:laundryId/service/:serviceId/items',
        description: 'Get all laundry service items',
        response: {},
    })
    async getAllLaundryServiceItems(
        @Param('laundryId') laundryId: string,
        @Param('serviceId') serviceId: string,
    ): Promise<any> {
        return await this._vendorService.getAllLaundryServiceItems(laundryId, serviceId);
    }

    @Authorized(UserType.ADMIN)
    @Patch({
        path: '/laundry/:laundryId/service/:serviceId/item/:itemId/edit',
        description: 'Edit laundry service item',
        response: {},
    })
    async editLaundryServiceItem(
        @Param('laundryId') laundryId: string,
        @Param('serviceId') serviceId: string,
        @Param('itemId') itemId: string,
        @Body() data: EditLaundryServiceItemRequestDTO,
        @CurrentUser() user: User,
    ): Promise<any> {
        return await this._vendorService.editLaundryServiceItem(laundryId, serviceId, itemId, data, user);
    }

    @Authorized(UserType.ADMIN)
    @Delete({
        path: '/laundry/:laundryId/service/:serviceId/item/:itemId/delete',
        description: 'Delete laundry service item',
        response: {},
    })
    async deleteLaundryServiceItem(
        @Param('laundryId') laundryId: string,
        @Param('serviceId') serviceId: string,
        @Param('itemId') itemId: string,
        @CurrentUser() user: User,
    ): Promise<any> {
        return await this._vendorService.deleteLaundryServiceItem(laundryId, serviceId, itemId, user);
    }

    // Laundry Item Category Management

    @Authorized(UserType.ADMIN)
    @Post({
        path: '/category/create',
        description: 'Create laundry item category',
        response: LaundryItemCategoryResponseDTO,
    })
    async createLaundryItemCategory(
        @Body() data: CreateLaundryItemCategoryRequestDTO,
    ): Promise<LaundryItemCategoryResponseDTO> {
        return await this._vendorService.createLaundryItemCategory(data);
    }

    @Authorized(UserType.ADMIN)
    @Get({
        path: '/categories',
        description: 'Get all laundry item categories',
        response: GetAllLaundryItemCategoriesResponseDTO,
    })
    async getAllLaundryItemCategories(): Promise<GetAllLaundryItemCategoriesResponseDTO> {
        return await this._vendorService.getAllLaundryItemCategories();
    }

    @Authorized(UserType.ADMIN)
    @Get({
        path: '/category/:categoryId',
        description: 'Get laundry item category by id',
        response: LaundryItemCategoryResponseDTO,
    })
    async getLaundryItemCategoryById(@Param('categoryId') categoryId: string): Promise<LaundryItemCategoryResponseDTO> {
        return await this._vendorService.getLaundryItemCategoryById(categoryId);
    }

    @Authorized(UserType.ADMIN)
    @Patch({
        path: '/category/:categoryId/edit',
        description: 'Edit laundry item category',
        response: LaundryItemCategoryMessageResponseDTO,
    })
    async editLaundryItemCategory(
        @Param('categoryId') categoryId: string,
        @Body() data: EditLaundryItemCategoryRequestDTO,
    ): Promise<LaundryItemCategoryMessageResponseDTO> {
        return await this._vendorService.editLaundryItemCategory(categoryId, data);
    }

    @Authorized(UserType.ADMIN)
    @Delete({
        path: '/category/:categoryId/delete',
        description: 'Delete laundry item category',
        response: LaundryItemCategoryMessageResponseDTO,
    })
    async deleteLaundryItemCategory(
        @Param('categoryId') categoryId: string,
    ): Promise<LaundryItemCategoryMessageResponseDTO> {
        return await this._vendorService.deleteLaundryItemCategory(categoryId);
    }
}
