import { Injectable } from '@nestjs/common';
import { Prisma, TokenReason, User } from '@prisma/client';
import DatabaseService from '../../../database/database.service';
import {
    BadRequestException,
    NotFoundException,
} from '../../../core/exceptions/response.exception';
import { BooleanResponseDTO } from '../../../core/response/response.schema';
import {
    ExcludeFields,
    GenerateUUID,
    GetOrderOptions,
    GetPaginationOptions,
    HashPassword,
} from '../../../helpers/util.helper';
import AuthService from '../../../modules/app/auth/auth.service';
import TokenService from '../../../modules/app/token/token.service';
import FindUsersRequestDTO from './dto/request/find.request';
import {
    ForgetPasswordRequestDTO,
    ForgetPasswordVerificationRequestDTO,
} from './dto/request/forget_password.request';
import LoginRequestDTO from './dto/request/login.request';
import ResetPasswordRequestDTO from './dto/request/reset_password.request';
import { SignupRequestDTO } from './dto/request/signup.request';
import FindUsersResponseDTO from './dto/response/find.response';
import {
    ForgetPasswordResponseDTO,
    ForgetPasswordVerificationResponseDTO,
} from './dto/response/forget_password.response';
import GetMeResponseDTO from './dto/response/me.response';
import GetUserByIdResponseDTO from './dto/response/getById.response';
import OAuthService from '../../../modules/oauth/oauth.service';
import SendVerificationCodeRequestDTO from './dto/request/send_verification_code.request';
import AppConfig from 'src/configs/app.config';
import SMSService from 'src/modules/sms/sms.service';
import { SendVerificationCodeResponseDTO } from './dto/response/send_verification_code.response';
import { VerifyOtpRequestDTO } from './dto/request/verifyOtpCode.request';
import UpdateUserDetailsRequestDTO from './dto/request/update_details.request';
import UpdateUserDetailsResponseDTO from './dto/response/update_details.response';
import VerifyOtpResponseDTO from './dto/response/verifyOtp.response';

@Injectable()
export default class UserService {
    constructor(
        private _dbService: DatabaseService,
        private _authService: AuthService,
        private _tokenService: TokenService,
        private _oauthService: OAuthService,
        private _smsService: SMSService
    ) { }

    async Login(data: LoginRequestDTO): Promise<string> {
        const user = await this._dbService.user.findFirst({
            where: { phone: data.phone },
            select: { id: true, email: true, password: true },
        });
        if (!user) {
            throw new BadRequestException('auth.invalid_credentials');
        }

        const token = await this._authService.CreateSession(user.id);

        return token;
    }

    async Signup(data: SignupRequestDTO): Promise<string> {
        const existingUser = await this._dbService.user.findFirst({
            where: { phone: data.phone },
            select: { id: true },
        });
        if (existingUser) {
            throw new BadRequestException('auth.phone_already_exist');
        }


        const user = await this._dbService.user.create({
            data: {
                phone: data.phone,
                type: data.type!,
                settings: {
                    create: {
                        latitude: data.latitude || 0,
                        longitude: data.longitude || 0,
                    },
                }
            },
            select: { id: true, email: true }
        })

        if (!user) {
            throw new BadRequestException('auth.error_creating_user');
        }

        const token = await this._authService.CreateSession(user.id);

        return token;
    }

    async ForgetPassword(data: ForgetPasswordRequestDTO): Promise<ForgetPasswordResponseDTO> {
        const user = await this._dbService.user.findFirst({
            where: { email: data.email.toLowerCase() },
        });
        if (!user) {
            throw new BadRequestException('user.not_found');
        }

        const token = await this._tokenService.CreatePasswordToken({
            uuid: GenerateUUID(),
            userId: user.id,
            reason: TokenReason.FORGOT_PASSWORD,
        });

        return { token };
    }

    async ForgetPasswordVerification(
        data: ForgetPasswordVerificationRequestDTO,
    ): Promise<ForgetPasswordVerificationResponseDTO> {
        const token = await this._tokenService.GetToken(data.token, TokenReason.FORGOT_PASSWORD);
        if (!token) {
            throw new BadRequestException('auth.invalid_token');
        }

        const resetToken = await this._tokenService.CreatePasswordToken({
            uuid: GenerateUUID(),
            userId: token.userId,
            reason: TokenReason.RESET_PASSWORD,
        });

        return { token: resetToken };
    }

    async ResetPassword(data: ResetPasswordRequestDTO): Promise<BooleanResponseDTO> {
        const token = await this._tokenService.GetToken(data.token, TokenReason.RESET_PASSWORD);
        if (!token) {
            throw new BadRequestException('auth.invalid_token');
        }

        const encryptedPassword = await HashPassword(data.password);

        await this._dbService.user.update({
            where: { id: token.userId },
            data: { password: encryptedPassword },
        });

        return { data: true };
    }

    async GetMe(user: User): Promise<GetMeResponseDTO> {
        const currentUser = await this._dbService.user.findUnique({
            where: { id: user.id },
            include: {
                settings: true,
                profilePicture: { select: { id: true, path: true, thumbPath: true } },
            },
        });
        return ExcludeFields(currentUser, ['password']);
    }

    async Find(data: FindUsersRequestDTO): Promise<FindUsersResponseDTO> {
        const where: Prisma.UserWhereInput = {
            ...(!!data.type && { type: data.type }),
        };
        const pagination = GetPaginationOptions(data);
        const order = GetOrderOptions(data);

        const users = await this._dbService.user.findMany({
            include: {
                profilePicture: true,
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

    async Get(id: number): Promise<GetUserByIdResponseDTO> {
        const basicUser = await this._dbService.user.findFirst({
            where: { id },
            select: { id: true },
        });
        if (!basicUser) {
            throw new NotFoundException('user.not_found');
        }

        const user = await this._dbService.user.findFirst({
            where: { id },
            include: {
                profilePicture: { select: { id: true, path: true, thumbPath: true } },
            },
        });

        return user;
    }

    async SendVerificationCode(data: SendVerificationCodeRequestDTO): Promise<SendVerificationCodeResponseDTO> {
        if (AppConfig.APP.ENV === 'dev') {
            return {
                message: "OTP sent successfully",
            };
        } else {
            const otp = await this._smsService.sendVerificationCode(data.phone);
            if (!otp) {
                throw new BadRequestException(
                    "Error while sending verification code, Please try again!!!"
                );
            }
            return {
                message: "OTP sent successfully",
            };
        }
    }

    async VerifyCode(data: VerifyOtpRequestDTO): Promise<VerifyOtpResponseDTO> {
        if (AppConfig.APP.ENV === 'dev' && data.otp === '123456') {
            const existingUser = await this._dbService.user.findFirst({
                where: { phone: data.phone },
                select: { id: true },
            });
            if (existingUser) {
                console.log("USER EXIST")
                const token = await this.Login(data);
                return { token }
            } else {
                console.log("USER NOT EXIST")
                const token = await this.Signup(data);
                return { token }
            }

        } else if (AppConfig.APP.ENV === 'dev' && data.otp !== '123456') {
            throw new BadRequestException(
                "You have entered the wrong otp"
            );
        } else {
            const otp = await this._smsService.verifyPhoneNumber(data.phone, data.otp);
            if (!otp) {
                throw new BadRequestException(
                    "Error while sending verification code, Please try again!!!"
                );
            }

            const existingUser = await this._dbService.user.findFirst({
                where: { phone: data.phone },
                select: { id: true },
            });
            if (existingUser) {
                const token = await this.Login(data);
                return { token }
            } else {
                const token = await this.Signup(data);
                return { token }
            }
        }
    }

    async UpdateUserDetails(data: UpdateUserDetailsRequestDTO, user: User): Promise<UpdateUserDetailsResponseDTO> {
        const userDetails = await this._dbService.user.findFirst({
            where: {
                id: user.id
            }
        })

        if (!userDetails) {
            throw new BadRequestException(
                "User not found"
            )
        }

        await this._dbService.user.update({
            where: {
                id: userDetails.id
            },
            data: {
                email: data.email && data.email,
                firstName: data.firstName && data.firstName,
                lastName: data.lastName && data.lastName
            }
        })

        const updatedUser = await this._dbService.user.findFirst({
            where: {
                id: userDetails.id
            }
        })


        return updatedUser
    }
}
