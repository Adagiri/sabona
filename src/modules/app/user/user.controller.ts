import { Body, Param, Query } from '@nestjs/common';
import { User, UserType } from '@prisma/client';
import { ApiController, Authorized, CurrentUser, Get, Patch, Post } from '../../../core/decorators';
import FindUsersRequestDTO from './dto/request/find.request';
import FindUsersResponseDTO from './dto/response/find.response';
import GetUserByIdResponseDTO from './dto/response/getById.response';
import GetMeResponseDTO from './dto/response/me.response';
import UserService from './user.service';
import UpdateUserDetailsRequestDTO from './dto/request/update_details.request';
import UpdateUserDetailsResponseDTO from './dto/response/update_details.response';
import addCustomerAddressResponseDTO from '../customer/dto/response/addCustomerAddress.response';
import getAllAddressesResponseDTO from '../customer/dto/response/getAllAddresses.response';
import editAddressRequestDTO from './dto/request/editAddress.request';
import editAddressParamRequestDTO from './dto/request/editAddressParam.request';
import EditAddressResponseDTO from './dto/response/editAddress.response';
import addCustomerAddressRequestDTO from './dto/request/addAddress.request';

@ApiController({ version: '1', tag: 'user' })
export default class UserController {
    constructor(private _userService: UserService) {}

    @Authorized()
    @Get({
        path: '/user/me',
        description: 'Get current user details',
        response: GetMeResponseDTO,
    })
    GetMe(@CurrentUser() user: User): Promise<GetMeResponseDTO> {
        return this._userService.GetMe(user);
    }

    @Authorized(UserType.ADMIN)
    @Get({
        path: '/users',
        description: 'Get users listing',
        response: FindUsersResponseDTO,
    })
    Find(@Query() data: FindUsersRequestDTO): Promise<FindUsersResponseDTO> {
        return this._userService.Find(data);
    }

    @Get({
        path: '/user/:id',
        description: 'Get user by id',
        response: GetUserByIdResponseDTO,
    })
    Get(@Param('id') id: string): Promise<GetUserByIdResponseDTO> {
        return this._userService.Get(id);
    }

    @Authorized()
    @Patch({
        path: '/user/update',
        description: 'update user details',
        response: UpdateUserDetailsResponseDTO,
    })
    UpdateUserDetails(
        @Body() data: UpdateUserDetailsRequestDTO,
        @CurrentUser() user: User,
    ): Promise<UpdateUserDetailsResponseDTO> {
        return this._userService.UpdateUserDetails(data, user);
    }

    @Authorized()
    @Post({
        path: 'user/address',
        description: 'Add an address',
        response: addCustomerAddressResponseDTO,
    })
    async AddAddress(
        @Body() data: addCustomerAddressRequestDTO,
        @CurrentUser() user: User,
    ): Promise<addCustomerAddressResponseDTO> {
        return await this._userService.AddAddress(data, user);
    }

    @Authorized()
    @Get({
        path: 'user/address',
        description: 'Get all user addresses',
        response: getAllAddressesResponseDTO,
    })
    async GetAllAddresses(@CurrentUser() user: User): Promise<getAllAddressesResponseDTO> {
        return await this._userService.GetAllAddresses(user);
    }

    @Authorized()
    @Patch({
        path: '/user/address/:id',
        description: 'Edit an address',
        response: EditAddressResponseDTO,
    })
    async EditAddress(
        @Body() data: editAddressRequestDTO,
        @Param() param: editAddressParamRequestDTO,
        @CurrentUser() user: User,
    ): Promise<EditAddressResponseDTO> {
        return await this._userService.EditAddress(data, param, user);
    }
}
