import { Body, Param, ParseIntPipe, Query } from '@nestjs/common';
import { User, UserType } from '@prisma/client';
import { ApiController, Authorized, CurrentUser, Get, Patch, Post } from '../../../core/decorators';
import FindUsersRequestDTO from './dto/request/find.request';
import FindUsersResponseDTO from './dto/response/find.response';
import GetUserByIdResponseDTO from './dto/response/getById.response';
import GetMeResponseDTO from './dto/response/me.response';
import UserService from './user.service';
import SendVerificationCodeRequestDTO from './dto/request/send_verification_code.request';
import { SendVerificationCodeResponseDTO } from './dto/response/send_verification_code.response';
import { VerifyOtpRequestDTO } from './dto/request/verifyOtpCode.request';
import UpdateUserDetailsRequestDTO from './dto/request/update_details.request';
import UpdateUserDetailsResponseDTO from './dto/response/update_details.response';
import VerifyOtpResponseDTO from './dto/response/verifyOtp.response';

@ApiController({ version: '1', tag: 'user' })
export default class UserController {
    constructor(private _userService: UserService) { }


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

    @Authorized()
    @Get({
        path: '/user/:id',
        description: 'Get user by id',
        response: GetUserByIdResponseDTO,
    })
    Get(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<GetUserByIdResponseDTO> {
        return this._userService.Get(id);
    }

    @Post({
        path: 'user/sendVerificationCode',
        description: 'send otp code',
        response: SendVerificationCodeResponseDTO
    })

    SendVerificationCode(
        @Body() data: SendVerificationCodeRequestDTO,
    ): Promise<SendVerificationCodeResponseDTO> {
        return this._userService.SendVerificationCode(data);
    }

    @Post({
        path: 'user/verifyCode',
        description: 'send otp code',
        response: VerifyOtpResponseDTO
    })

    VerifyCode(
        @Body() data: VerifyOtpRequestDTO,
    ): Promise<VerifyOtpResponseDTO> {
        return this._userService.VerifyCode(data);
    }

    @Authorized()
    @Patch({
        path: '/user/update',
        description: "update user details",
        response: UpdateUserDetailsResponseDTO
    })

    UpdateUserDetails(
        @Body() data: UpdateUserDetailsRequestDTO,
        @CurrentUser() user: User
    ): Promise<UpdateUserDetailsResponseDTO> {
        return this._userService.UpdateUserDetails(data, user);
    }

}
