import { Body } from '@nestjs/common';
import { ApiController, Post } from '../../../core/decorators';
import LoginResponseDTO from './dto/response/login.response';
import UserService from './user.service';
import LoginRequestDTO from './dto/request/login.request';
import { SendVerificationCodeResponseDTO } from './dto/response/send_verification_code.response';
import SendVerificationCodeRequestDTO from './dto/request/send_verification_code.request';
import VerifyOtpResponseDTO from './dto/response/verifyOtp.response';
import { VerifyOtpRequestDTO } from './dto/request/verifyOtpCode.request';
import { isUserExistResponseDTO } from './dto/response/isUserExist.response';
import IsUserExistRequestDTO from './dto/request/isUserExist.request';
import { SocialVerificationRequestDTO } from './dto/request/socialVerification.request';
import IsUserWithEmailExistRequestDTO from './dto/request/isUserWithEmailExist.request';
import { VendorSignupRequestDTO } from './dto/request/vendorSignup.request';
import { VendorSignupResponseDTO } from './dto/response/vendorSignup.response';

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
        response: SendVerificationCodeResponseDTO,
    })
    SendVerificationCode(@Body() data: SendVerificationCodeRequestDTO): Promise<SendVerificationCodeResponseDTO> {
        return this._userService.SendVerificationCode(data);
    }

    @Post({
        path: 'vendorSignup',
        description: 'signup flow for vendor',
        response: VerifyOtpResponseDTO,
    })
    vendorSignup(@Body() data: VendorSignupRequestDTO): Promise<VendorSignupResponseDTO> {
        return this._userService.VendorSignup(data);
    }

    @Post({
        path: 'verifyCode',
        description: 'send otp code',
        response: VerifyOtpResponseDTO,
    })
    VerifyCode(@Body() data: VerifyOtpRequestDTO): Promise<VerifyOtpResponseDTO> {
        return this._userService.VerifyCode(data);
    }

    @Post({
        path: 'resendVerificationCode',
        description: 're-send otp code',
        response: SendVerificationCodeResponseDTO,
    })
    ResendVerificationCode(@Body() data: SendVerificationCodeRequestDTO): Promise<SendVerificationCodeResponseDTO> {
        return this._userService.ResendVerificationCode(data);
    }

    @Post({
        path: 'isUserExist',
        description: 'Check if user exist',
        response: isUserExistResponseDTO,
    })
    IsUserExist(@Body() data: IsUserExistRequestDTO): Promise<isUserExistResponseDTO> {
        return this._userService.checkIsUserExist(data);
    }

    @Post({
        path: 'isUserWithEmailExist',
        description: 'Check if user with email exist',
        response: isUserExistResponseDTO,
    })
    IsUserWithEmailExist(@Body() data: IsUserWithEmailExistRequestDTO): Promise<isUserExistResponseDTO> {
        return this._userService.checkIsUserWithEmailExist(data);
    }

    @Post({
        path: 'social-verification',
        description: 'Check if user exist',
        response: VerifyOtpResponseDTO,
    })
    SocialVerification(@Body() data: SocialVerificationRequestDTO): Promise<VerifyOtpResponseDTO> {
        return this._userService.socialVerification(data);
    }
}
