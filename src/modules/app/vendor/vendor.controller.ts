import { ApiController, Authorized, CurrentUser, Delete, Get, Patch, Post } from 'src/core/decorators';
import VendorService from './vendor.service';
import { User } from '@prisma/client';
import GetOrderRequestsResponseDTO from './dto/response/getOrderRequests.response';
import { Body, Param } from '@nestjs/common';
import UpdateStatusRequestDTO from './dto/request/updateStatus.request';
import UpdateStatusResponseDTO from './dto/response/updateStatus.response';
import  { LaundryServiceDTO } from './dto/request/createLaundry.request';
import EditLaundryRequestDTO from './dto/request/editLaundry.request';
import EditLaundryServiceRequestDTO from './dto/request/laundryServiceEdit.request';
import { CreateLaundryServiceItemsArrayDTO } from './dto/request/createLaundryServiceItem.request';
import { EditLaundryServiceItemRequestDTO } from './dto/request/editlaundryServiceItem.request';
import { GetAllLaundriesResponseDTO } from './dto/response/getAllLaundry.response';
import { GetLaundryByIdResponseDTO } from './dto/response/getLaundryById.response';
import LaundryMessageResponseDTO from './dto/response/laundryMessage';
import LaundryServiceMessageResponseDTO from './dto/response/laundryServiceMessage.response';
import GetOrderRequestDTO from './dto/request/getOrder.request';
import CancelOrderRequestDTO from './dto/request/cancelOrder.request';
import { CreateLaundryItemCategoryRequestDTO } from './dto/request/createLaundryItemCategory.request';
import { EditLaundryItemCategoryRequestDTO } from './dto/request/editLaundryItemCategory.request';
import {
    LaundryItemCategoryResponseDTO,
    GetAllLaundryItemCategoriesResponseDTO,
    LaundryItemCategoryMessageResponseDTO,
} from './dto/response/laundryItemCategory.response';

@ApiController({
    path: '/vendor',
    tag: 'vendor',
    version: '1',
})
export default class VendorController {
    constructor(private _vendorService: VendorService) {}

    @Authorized()
    @Get({
        path: '/orderRequests/:laundryId',
        description: 'Get all order requests',
        response: GetOrderRequestsResponseDTO,
    })
    async getOrderRequests(
        @Param() param: GetOrderRequestDTO,
        @CurrentUser() user: User,
    ): Promise<GetOrderRequestsResponseDTO> {
        return await this._vendorService.getOrderRequests(user, param);
    }

    @Authorized()
    @Get({
        path: '/laundry',
        description: 'Get user laundry',
        response: {},
    })
    async getLaundry(@CurrentUser() user: User): Promise<any> {
        return await this._vendorService.getUserLaundry(user);
    }

    @Authorized()
    @Get({
        path: 'orders',
        description: 'Get all orders',
        response: {},
    })
    async getOrders(@CurrentUser() user: User): Promise<any> {
        return await this._vendorService.getOrders(user);
    }

    @Authorized()
    @Patch({
        path: '/:orderId/:status',
        description: 'Update order status',
        response: UpdateStatusResponseDTO,
    })
    async updateOrderStatus(
        @Param() params: UpdateStatusRequestDTO,
        @CurrentUser() user: User,
    ): Promise<UpdateStatusResponseDTO> {
        return await this._vendorService.updateOrderStatus(params, user);
    }

    @Authorized()
    @Patch({
        path: '/order/:orderId/cancel',
        description: 'Cancel order',
        response: UpdateStatusResponseDTO,
    })
    async cancelOrder(
        @Param() params: CancelOrderRequestDTO,
        @CurrentUser() user: User,
    ): Promise<UpdateStatusResponseDTO> {
        return await this._vendorService.cancelOrder(params, user);
    }

    @Authorized()
    @Get({
        path: '/orders',
        description: 'Get all orders',
        response: {},
    })
    async getAllOrders(@CurrentUser() user: User): Promise<any> {
        return await this._vendorService.getAllOrders(user);
    }

    @Authorized()
    @Get({
        path: '/order',
        description: 'Get last completed order',
        response: {},
    })
    async getLastOrder(@CurrentUser() user: User): Promise<any> {
        return await this._vendorService.getLastCompletedOrder(user);
    }

    // @Authorized()
    // @Post({
    //     path: '/laundry/create',
    //     description: 'Add laundry',
    //     response: CreateLaundryReponseDTO,
    // })
    // async addLaundry(
    //     @Body() data: CreateLaundryRequestDTO,
    //     @CurrentUser() user: User,
    // ): Promise<CreateLaundryReponseDTO> {
    //     return await this._vendorService.addLaundry(data, user);
    // }

    @Get({
        path: '/laundry/all',
        description: 'Get all laundries',
        response: GetAllLaundriesResponseDTO,
    })
    async getAllLaundries(): Promise<GetAllLaundriesResponseDTO> {
        return await this._vendorService.getAllLaundries();
    }

    @Get({
        path: '/laundry/:laundryId',
        description: 'Get laundry by id',
        response: GetLaundryByIdResponseDTO,
    })
    async getLaundryById(
        @Param('laundryId') laundryId: string,
        // @CurrentUser() user: User,
    ): Promise<GetLaundryByIdResponseDTO> {
        return await this._vendorService.getLaundryById(laundryId);
    }

    @Authorized()
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

    @Authorized()
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

    @Authorized()
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

    @Authorized()
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

    @Authorized()
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

    @Authorized()
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

    @Get({
        path: '/laundry/:laundryId/service/:serviceId/items',
        description: 'Get all laundry service items',
        response: {},
    })
    async getAllLaundryServiceItems(
        @Param('laundryId') laundryId: string,
        @Param('serviceId') serviceId: string,
        // @CurrentUser() user: User,
    ): Promise<any> {
        return await this._vendorService.getAllLaundryServiceItems(laundryId, serviceId);
    }

    @Authorized()
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

    @Authorized()
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

    @Get({
        path: '/categories',
        description: 'Get all laundry item categories',
        response: GetAllLaundryItemCategoriesResponseDTO,
    })
    async getAllLaundryItemCategories(): Promise<GetAllLaundryItemCategoriesResponseDTO> {
        return await this._vendorService.getAllLaundryItemCategories();
    }

    @Get({
        path: '/category/:categoryId',
        description: 'Get laundry item category by id',
        response: LaundryItemCategoryResponseDTO,
    })
    async getLaundryItemCategoryById(@Param('categoryId') categoryId: string): Promise<LaundryItemCategoryResponseDTO> {
        return await this._vendorService.getLaundryItemCategoryById(categoryId);
    }

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
