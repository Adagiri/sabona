import { Injectable } from '@nestjs/common';
import { Prisma, User, UserStatus, UserType } from '@prisma/client';
import DatabaseService from '../../../database/database.service';
import {
    BadRequestException,
    NotFoundException,
} from '../../../core/exceptions/response.exception';
import {
    GetOrderOptions,
    GetPaginationOptions,
} from '../../../helpers/util.helper';
import AuthService from '../../../modules/app/auth/auth.service';
import TokenService from '../../../modules/app/token/token.service';
import FindUsersRequestDTO from './dto/request/find.request';
import LoginRequestDTO from './dto/request/login.request';
import { SignupRequestDTO } from './dto/request/signup.request';
import FindUsersResponseDTO from './dto/response/find.response';
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
import { APP_ENV, OTP_CODE_FOR_DEV } from 'src/constants';
import addCustomerAddressResponseDTO from '../customer/dto/response/addCustomerAddress.response';
import getAllAddressesResponseDTO from '../customer/dto/response/getAllAddresses.response';
import editAddressRequestDTO from './dto/request/editAddress.request';
import editAddressParamRequestDTO from './dto/request/editAddressParam.request';
import EditAddressResponseDTO from './dto/response/editAddress.response';
import LoginResponseDTO from './dto/response/login.response';
import addCustomerAddressRequestDTO from './dto/request/addAddress.request';

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
            select: { id: true, email: true },
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
                status: data.type === UserType.USER ? UserStatus.ACTIVE : UserStatus.INACTIVE,
                settings: {
                    create: {
                        lat: data.latitude || 0,
                        long: data.longitude || 0,
                    },
                },
                password: data.password,
            },
            select: { id: true, email: true }
        })

        if (!user) {
            throw new BadRequestException('auth.error_creating_user');
        }

        const token = await this._authService.CreateSession(user.id);

        return token;
    }


    async UpdateUserLocation(userId: string, lat: any, long: any): Promise<any> {
        const latitude = parseFloat(lat);
        const longitude = parseFloat(long);
    
        await this._dbService.userSettings.update({
            where: {
                userId,
            },
            data: {
                lat: latitude,
                long: longitude,
            }
        });
    
        return true;
    }
    

    async GetMe(user: User): Promise<GetMeResponseDTO> {
        const currentUser = await this._dbService.user.findUnique({
            where: { id: user.id },
            include: {
                settings: true,
                profilePicture: { select: { id: true, path: true, thumbPath: true } },
                addresses: true,
                laundry: {
                    select:{
                        laundryService:{
                            select:{
                                id: true,
                                name: true,
                                description: true,
                                laundryServiceItems:{
                                    select:{
                                        id: true,
                                        name: true,
                                        price: true,
                                    }
                                }
                            }
                        },
                        address: true,
                        name: true,
                        id: true,
                    }
                },
            },
        });
        return currentUser
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

    async Get(id: string): Promise<GetUserByIdResponseDTO> {
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
        const user = await this._dbService.user.findUnique({
            where: { phone: data.phone },
        })
        if (user) {
            throw new BadRequestException(
                "Phone number is already registered"
            );
        }
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
        if (AppConfig.APP.ENV !== APP_ENV.PROD && data.otp === OTP_CODE_FOR_DEV) {
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

        } else if (AppConfig.APP.ENV !== APP_ENV.PROD && data.otp !== OTP_CODE_FOR_DEV) {
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

    async LoginWithEmailPassword(data: LoginRequestDTO): Promise<LoginResponseDTO> {
        const doesUserExist = await this._dbService.user.findUnique({
            where:{
                phone: data.phone
            }
        })

        if (!doesUserExist){
            throw new BadRequestException("User not registered")
        }
        const user = await this._dbService.user.findFirst({
            where: { phone: data.phone, password: data.password },

            select: { id: true, email: true },
        });
        if (!user) {
            throw new BadRequestException('auth.invalid_credentials');
        }

        const token = await this._authService.CreateSession(user.id);

        return { token };
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


    async AddAddress(data: addCustomerAddressRequestDTO, user: User): Promise<addCustomerAddressResponseDTO> {
        const address = await this._dbService.userAddress.create({
            data: {
                userId: user.id.toString(),
                ...data
            }
        })

        return address;
    }

    async GetAllAddresses(user: User): Promise<getAllAddressesResponseDTO>{
        const addresses = await this._dbService.userAddress.findMany({
            where: {
                userId: user.id,
            },
            select: {
                id: true,
                address: true,
                lat: true,
                long: true,
                label: true,
                isDefault: true,
                createdAt: true,
                updatedAt: true
            }
        })

        return { data: addresses };
    }

    async EditAddress(data: editAddressRequestDTO, param: editAddressParamRequestDTO, user: User): Promise<EditAddressResponseDTO> {

        const isUsersAddress = this._dbService.userAddress.findFirst({
            where: {
                AND: {
                    id: param.id,
                    userId: user.id
                }
            }
        })

        if (!isUsersAddress){
            throw new BadRequestException("This is not current user's address")
        }

        const address = await this._dbService.userAddress.update({
            where: {
                id: param.id,
            },
            data: {
                address: data.address,
                lat: data.lat,
                long: data.long,
                label: data.label,
                isDefault: data.isDefault
            },
        })

        if (!address) {
            throw new BadRequestException("Error changing address")
        }

        const changedAddress = await this._dbService.userAddress.findUnique({
            where: {
                id: param.id
            },
            select: {
                id: true,
                address: true,
                label: true,
                lat: true, 
                long: true,
                isDefault: true
            }
        })

        return changedAddress;

    }

    async ResendVerificationCode(data: SendVerificationCodeRequestDTO): Promise<SendVerificationCodeResponseDTO> {
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


}
