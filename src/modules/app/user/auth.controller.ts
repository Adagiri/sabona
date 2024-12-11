import { Body } from '@nestjs/common';
import { ApiController, Post } from '../../../core/decorators';
import LoginResponseDTO from './dto/response/login.response';
import UserService from './user.service';
import LoginRequestDTO from './dto/request/login.request';
import { SendVerificationCodeResponseDTO } from './dto/response/send_verification_code.response';
import SendVerificationCodeRequestDTO from './dto/request/send_verification_code.request';
import VerifyOtpResponseDTO from './dto/response/verifyOtp.response';
import { VerifyOtpRequestDTO } from './dto/request/verifyOtpCode.request';

@ApiController({ version: '1', tag: 'auth', path: '/auth' })
export default class AuthController {
    constructor(private _userService: UserService) {}

    @Post({
        path: '/login',
        description: 'Login to the application',
        response: LoginResponseDTO,
    })
    LoginWithEmailPassword(@Body() data: LoginRequestDTO): Promise<LoginResponseDTO> {
        return this._userService.LoginWithEmailPassword(data);
    }

    @Post({
        path: 'sendVerificationCode',
        description: 'send otp code',
        response: SendVerificationCodeResponseDTO
    })

    SendVerificationCode(
        @Body() data: SendVerificationCodeRequestDTO,
    ): Promise<SendVerificationCodeResponseDTO> {
        return this._userService.SendVerificationCode(data);
    }

    @Post({
        path: 'verifyCode',
        description: 'send otp code',
        response: VerifyOtpResponseDTO
    })

    VerifyCode(
        @Body() data: VerifyOtpRequestDTO,
    ): Promise<VerifyOtpResponseDTO> {
        return this._userService.VerifyCode(data);
    }

    @Post({
        path: 'resendVerificationCode',
        description: 're-send otp code',
        response: SendVerificationCodeResponseDTO
    })

    ResendVerificationCode(
        @Body() data: SendVerificationCodeRequestDTO,
    ): Promise<SendVerificationCodeResponseDTO> {
        return this._userService.ResendVerificationCode(data);
    }


}
