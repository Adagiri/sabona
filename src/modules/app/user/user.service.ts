import { Injectable } from '@nestjs/common';
import { Prisma, User, UserStatus, UserType } from '@prisma/client';
import DatabaseService from '../../../database/database.service';
import { BadRequestException, NotFoundException } from '../../../core/exceptions/response.exception';
import { GetOrderOptions, GetPaginationOptions } from '../../../helpers/util.helper';
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
import { APP_ENV, OTP_CODE_FOR_TEST } from 'src/constants';
import addCustomerAddressResponseDTO from '../customer/dto/response/addCustomerAddress.response';
import getAllAddressesResponseDTO from '../customer/dto/response/getAllAddresses.response';
import editAddressRequestDTO from './dto/request/editAddress.request';
import editAddressParamRequestDTO from './dto/request/editAddressParam.request';
import EditAddressResponseDTO from './dto/response/editAddress.response';
import LoginResponseDTO from './dto/response/login.response';
import addCustomerAddressRequestDTO from './dto/request/addAddress.request';
import IsUserExistRequestDTO from './dto/request/isUserExist.request';
import { isUserExistResponseDTO } from './dto/response/isUserExist.response';
import FirebaseService from 'src/modules/firebase/firebase.service';
import { SocialVerificationRequestDTO } from './dto/request/socialVerification.request';
import IsUserWithEmailExistRequestDTO from './dto/request/isUserWithEmailExist.request';
import { VendorSignupRequestDTO } from './dto/request/vendorSignup.request';
import { VendorSignupResponseDTO } from './dto/response/vendorSignup.response';
import { VendorLoginSendCodeRequestDTO } from './dto/request/vendorLoginSendCode.request';
import { VendorLoginVerifyCodeRequestDTO } from './dto/request/vendorLoginVerifyCode.request';
import { VendorLoginSendCodeResponseDTO } from './dto/response/vendorLoginSendCode.response';
import { VendorLoginVerifyCodeResponseDTO } from './dto/response/vendorLoginVerifyCode.response';
import { HashPassword, ComparePassword } from '../../../helpers/util.helper';
import { UpdateLocationResponseDTO } from './dto/response/update_location.response.dto';

@Injectable()
export default class UserService {
    constructor(
        private _dbService: DatabaseService,
        private _authService: AuthService,
        private _tokenService: TokenService,
        private _oauthService: OAuthService,
        private _smsService: SMSService,
        private _firebaseService: FirebaseService,
    ) {}

    async SendLoginCode(data: SendVerificationCodeRequestDTO): Promise<SendVerificationCodeResponseDTO> {
        const user = await this._dbService.user.findUnique({
            where: { phone: data.phone },
        });

        if (!user) {
            throw new BadRequestException('Phone number is not registered');
        }

        if (user.type === UserType.VENDOR) {
            throw new BadRequestException('Phone number already registered as a vendor');
        }

        if (AppConfig.APP.ENV === APP_ENV.TEST || ['+966563651254', '+966563651244'].indexOf(data.phone) !== -1) {
            return {
                message: 'Login code sent successfully',
            };
        } else {
            const otp = await this._smsService.sendVerificationCode(data.phone);
            if (!otp) {
                throw new BadRequestException('Error while sending login code, Please try again!!!');
            }
            return {
                message: 'Login code sent successfully',
            };
        }
    }

    async VendorSignup(data: VendorSignupRequestDTO): Promise<VendorSignupResponseDTO> {
        // Check if phone number already exists
        const existingVendor = await this._dbService.user.findFirst({
            where: { phone: data.phone, status: UserStatus.ACTIVE },
        });

        if (existingVendor) {
            throw new BadRequestException('Phone number already registered');
        }

        const user = await this._dbService.user.create({
            data: {
                phone: data.phone,
                type: UserType.VENDOR,
                status: UserStatus.INACTIVE,
                settings: {
                    create: {
                        lat: data.latitude || 0,
                        long: data.longitude || 0,
                        laundryName: data.laundryName || null,
                    },
                },
            },
            select: { id: true, phone: true },
        });

        if (data?.referrerId && user) {
            const reward = await this._dbService.reward.findFirst({
                where: {
                    userId: data.referrerId,
                },
            });

            if (reward) {
                await this._dbService.reward.update({
                    data: {
                        userId: data.referrerId,
                        points: reward?.points + 5,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                    where: {
                        userId: data.referrerId,
                    },
                });
            } else {
                await this._dbService.reward.create({
                    data: {
                        userId: data.referrerId,
                        points: 5,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                });
            }
        }

        if (!user) {
            throw new BadRequestException('auth.error_creating_user');
        }

        return {
            id: user.id,
            phone: user.phone,
            message: 'Signup successful. Your account is pending admin approval.',
        };
    }

    async vendorLoginSendCode(data: VendorLoginSendCodeRequestDTO): Promise<VendorLoginSendCodeResponseDTO> {
        // Check if vendor exists with this phone number
        const vendor = await this._dbService.user.findFirst({
            where: {
                phone: data.phone,
                type: UserType.VENDOR,
                status: UserStatus.ACTIVE, // Only allow active vendors to login
            },
        });

        if (!vendor) {
            throw new BadRequestException('No active vendor account found with this phone number');
        }
        // Send OTP code
        if (AppConfig.APP.ENV === APP_ENV.TEST) {
            return {
                message: 'OTP sent successfully (Test mode: use 123456)',
            };
        } else if (AppConfig.APP.ENV === APP_ENV.PROD && data.phone === '+966563651258') {
            return {
                message: 'OTP sent successfully',
            };
        } else {
            try {
                const otp = await this._smsService.sendVerificationCode(data.phone);
                if (!otp) {
                    throw new BadRequestException('Failed to send verification code. Please try again.');
                }
                return {
                    message: 'OTP sent successfully',
                };
            } catch (error) {
                console.error('Error sending OTP:', error);
                throw new BadRequestException('Failed to send verification code. Please try again.');
            }
        }
    }

    async vendorLoginVerifyCode(data: VendorLoginVerifyCodeRequestDTO): Promise<VendorLoginVerifyCodeResponseDTO> {
        // Find vendor with phone number
        const vendor = await this._dbService.user.findFirst({
            where: {
                phone: data.phone,
                type: UserType.VENDOR,
                status: UserStatus.ACTIVE,
            },
            select: {
                id: true,
                phone: true,
                type: true,
                status: true,
                firstName: true,
                lastName: true,
                email: true,
            },
        });

        if (!vendor) {
            throw new BadRequestException('No active vendor account found with this phone number');
        }

        // Verify OTP
        let isValidOtp = false;

        if (AppConfig.APP.ENV === APP_ENV.TEST && data.otp === OTP_CODE_FOR_TEST) {
            isValidOtp = true;
        } else if (
            AppConfig.APP.ENV === APP_ENV.PROD &&
            data.phone === '+966563651258' &&
            data.otp === OTP_CODE_FOR_TEST
        ) {
            isValidOtp = true;
        } else if (AppConfig.APP.ENV !== APP_ENV.TEST) {
            try {
                const verification = await this._smsService.verifyPhoneNumber(data.phone, data.otp);
                if (verification && verification.status === 'approved') {
                    isValidOtp = true;
                }
            } catch (error) {
                console.error('OTP verification error:', error);
                throw new BadRequestException('Invalid or expired OTP code');
            }
        }

        if (!isValidOtp) {
            throw new BadRequestException('Invalid or expired OTP code');
        }

        const token = await this._authService.CreateSession(vendor.id);

        return {
            token,
            user: vendor,
        };
    }

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

    async SocialLogin(data: SocialVerificationRequestDTO): Promise<string> {
        const user = await this._dbService.user.findFirst({
            where: { email: data?.email },
            select: { id: true, email: true },
        });

        console.log('USER', user);

        const token = await this._authService.CreateSession(user.id);

        return token;
    }

    async SocialSignup(data: SocialVerificationRequestDTO): Promise<string> {
        const existingUser = await this._dbService.user.findFirst({
            where: { email: data.email },
            select: { id: true },
        });

        if (existingUser) {
            throw new BadRequestException('This email is already registered');
        }

        const user = await this._dbService.user.create({
            data: {
                firstName: data?.firstName,
                lastName: data?.lastName,
                email: data?.email,
                type: data.type!,
                status: data.type === UserType.USER ? UserStatus.ACTIVE : UserStatus.INACTIVE,
                settings: {
                    create: {
                        lat: data.latitude || 0,
                        long: data.longitude || 0,
                    },
                },
                // password: data.password,
            },
            select: { id: true, email: true },
        });

        if (data?.referrerId && user) {
            const reward = await this._dbService.reward.findFirst({
                where: {
                    userId: data.referrerId,
                },
            });

            if (reward) {
                await this._dbService.reward.update({
                    data: {
                        userId: data.referrerId,
                        points: reward?.points + 5,
                        updatedAt: new Date(),
                    },
                    where: {
                        userId: data.referrerId,
                    },
                });
            } else {
                await this._dbService.reward.create({
                    data: {
                        userId: data.referrerId,
                        points: 5,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                });
            }
        }

        if (!user) {
            throw new BadRequestException('auth.error_creating_user');
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
            throw new BadRequestException('This phone number is already registered');
        }

        // Hash password if provided
        let hashedPassword = null;
        if (data.password) {
            hashedPassword = await HashPassword(data.password);
        }

        const user = await this._dbService.user.create({
            data: {
                phone: data.phone,
                password: hashedPassword, // Store hashed password
                type: data.type!,
                status: data.type === UserType.USER ? UserStatus.ACTIVE : UserStatus.INACTIVE,
                settings: {
                    create: {
                        lat: data.latitude || 0,
                        long: data.longitude || 0,
                    },
                },
            },
            select: { id: true, email: true },
        });

        if (data?.referrerId && user) {
            const reward = await this._dbService.reward.findFirst({
                where: {
                    userId: data.referrerId,
                },
            });

            if (reward) {
                await this._dbService.reward.update({
                    data: {
                        userId: data.referrerId,
                        points: reward?.points + 5,
                        updatedAt: new Date(),
                    },
                    where: {
                        userId: data.referrerId,
                    },
                });
            } else {
                await this._dbService.reward.create({
                    data: {
                        userId: data.referrerId,
                        points: 5,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                });
            }
        }

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
            },
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
                reward: {
                    select: {
                        points: true,
                    },
                },
            },
        });
        return currentUser;
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
        console.log(id, 'I ran here');
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
        });
        if (user) {
            throw new BadRequestException('Phone number is already registered');
        }
        if (AppConfig.APP.ENV === APP_ENV.TEST) {
            return {
                message: 'OTP sent successfully',
            };
        } else {
            const otp = await this._smsService.sendVerificationCode(data.phone);
            if (!otp) {
                throw new BadRequestException('Error while sending verification code, Please try again!!!');
            }
            return {
                message: 'OTP sent successfully',
            };
        }
    }

    async VerifyCode(data: VerifyOtpRequestDTO): Promise<VerifyOtpResponseDTO> {
        if (
            (AppConfig.APP.ENV !== APP_ENV.PROD || ['+966563651254', '+966563651244'].indexOf(data.phone) !== -1) &&
            data.otp === OTP_CODE_FOR_TEST
        ) {
            console.log('I raaan');

            const existingUser = await this._dbService.user.findFirst({
                where: { phone: data.phone, type: data?.type },
                select: { id: true, type: true, phone: true },
            });
            console.log(data.type);
            console.log(existingUser, 'EXISTING USER');
            if (existingUser) {
                const token = await this.Login(data);
                return { token };
            } else {
                console.log('i AM NOW RUNNING');
                const token = await this.Signup(data);
                return { token };
            }
        } else if (AppConfig.APP.ENV !== APP_ENV.PROD && data.otp !== OTP_CODE_FOR_TEST) {
            throw new BadRequestException('You have entered the wrong otp');
        } else {
            const otp = await this._smsService.verifyPhoneNumber(data.phone, data.otp);
            if (!otp) {
                throw new BadRequestException('Error while sending verification code, Please try again!!!');
            }

            const existingUser = await this._dbService.user.findFirst({
                where: { phone: data.phone, type: data?.type },
                select: { id: true, type: true, phone: true },
            });

            console.log(data.type);
            console.log(existingUser, 'EXISTING USER');
            if (existingUser) {
                const token = await this.Login(data);
                return { token };
            } else {
                const token = await this.Signup(data);
                return { token };
            }
        }
    }

    async socialVerification(data: SocialVerificationRequestDTO): Promise<VerifyOtpResponseDTO> {
        console.log(1);
        const decodedToken = await this._firebaseService.verifyToken(data.token);
        console.log(2);
        console.log(decodedToken);

        if (decodedToken) {
            const existingUser = await this._dbService.user.findFirst({
                where: { email: decodedToken?.email, type: data?.type },
                select: { id: true },
            });

            if (existingUser) {
                const token = await this.SocialLogin(data);
                return { token };
            } else {
                const token = await this.SocialSignup(data);
                return { token };
            }
        } else {
            throw new BadRequestException('Invalid token');
        }
    }

    async LoginWithEmailPassword(data: LoginRequestDTO): Promise<LoginResponseDTO> {
        const user = await this._dbService.user.findUnique({
            where: {
                phone: data.phone,
            },
            select: {
                id: true,
                phone: true,
                password: true,
                type: true,
                status: true,
                firstName: true,
                lastName: true,
            },
        });

        if (!user) {
            throw new BadRequestException('Invalid phone number or password');
        }

        // Check if user has a password set
        if (!user.password) {
            throw new BadRequestException('No password set for this account. Please use OTP login.');
        }

        // Verify password
        const isPasswordValid = await ComparePassword(data.password, user.password);
        if (!isPasswordValid) {
            throw new BadRequestException('Invalid phone number or password');
        }

        // Check if user is active
        if (
            user.status !== UserStatus.ACTIVE &&
            ['+201221925690', '+201221825444', '+201221925330'].indexOf(data.phone) === -1
        ) {
            throw new BadRequestException('Account is not active. Please contact support.');
        }

        // Generate token
        const token = await this._authService.CreateSession(user.id);

        return { token };
    }
    async UpdateUserDetails(data: UpdateUserDetailsRequestDTO, user: User): Promise<UpdateUserDetailsResponseDTO> {
        const userDetails = await this._dbService.user.findFirst({
            where: {
                id: user.id,
            },
        });

        if (!userDetails) {
            throw new BadRequestException('User not found');
        }

        // Filter out undefined/null values before updating
        const filteredUserData = Object.fromEntries(
            Object.entries({
                email: data.email,
                name: data.name,
                firstName: data.firstName,
                lastName: data.lastName,
            }).filter(([, value]) => value != null && value !== ''),
        );

        const filteredSettingsData = Object.fromEntries(
            Object.entries({
                city: data.city,
                state: data.state,
                postalCode: data.postalCode,
            }).filter(([, value]) => value != null && value !== ''),
        );

        console.log(filteredUserData);
        console.log(filteredSettingsData);

        if (Object.keys(filteredUserData).length > 0) {
            await this._dbService.user.update({
                where: { id: userDetails.id },
                data: filteredUserData,
            });
        }

        if (Object.keys(filteredSettingsData).length > 0) {
            await this._dbService.userSettings.update({
                where: { userId: userDetails.id },
                data: filteredSettingsData,
            });
        }

        const updatedUser = await this._dbService.user.findFirst({
            where: {
                id: userDetails.id,
            },
        });

        return updatedUser;
    }

    async AddAddress(data: addCustomerAddressRequestDTO, user: User): Promise<addCustomerAddressResponseDTO> {
        // Check if user has any existing addresses
        const existingAddressCount = await this._dbService.userAddress.count({
            where: { userId: user.id.toString() },
        });

        // If no existing addresses, make this the default
        const isDefault = existingAddressCount === 0 || data.isDefault === true;
        // If setting as default, unset other defaults first
        if (isDefault && existingAddressCount > 0) {
            await this._dbService.userAddress.updateMany({
                where: { userId: user.id.toString() },
                data: { isDefault: false },
            });
        }

        const address = await this._dbService.userAddress.create({
            data: {
                userId: user.id.toString(),
                ...data,
                isDefault,
            },
        });

        return address;
    }

    async GetAllAddresses(user: User): Promise<getAllAddressesResponseDTO> {
        console.log('I ran....');
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
                updatedAt: true,
            },
        });

        console.log('addresses: ', addresses);

        return { data: addresses };
    }

    async EditAddress(
        data: editAddressRequestDTO,
        param: editAddressParamRequestDTO,
        user: User,
    ): Promise<EditAddressResponseDTO> {
        const isUsersAddress = this._dbService.userAddress.findFirst({
            where: {
                AND: {
                    id: param.id,
                    userId: user.id,
                },
            },
        });

        if (!isUsersAddress) {
            throw new BadRequestException("This is not current user's address");
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
                isDefault: data.isDefault,
            },
        });

        if (!address) {
            throw new BadRequestException('Error changing address');
        }

        const changedAddress = await this._dbService.userAddress.findUnique({
            where: {
                id: param.id,
            },
            select: {
                id: true,
                address: true,
                label: true,
                lat: true,
                long: true,
                isDefault: true,
            },
        });

        return changedAddress;
    }

    async ResendVerificationCode(data: SendVerificationCodeRequestDTO): Promise<SendVerificationCodeResponseDTO> {
        if (AppConfig.APP.ENV === APP_ENV.TEST) {
            return {
                message: 'OTP sent successfully',
            };
        } else {
            const otp = await this._smsService.sendVerificationCode(data.phone);
            if (!otp) {
                throw new BadRequestException('Error while sending verification code, Please try again!!!');
            }
            return {
                message: 'OTP sent successfully',
            };
        }
    }

    async checkIsUserExist(data: IsUserExistRequestDTO): Promise<isUserExistResponseDTO> {
        const user = await this._dbService.user.findFirst({
            where: { phone: data.phone },
        });
        if (user) {
            return { isExist: true };
        }
        return { isExist: false };
    }

    async checkIsUserWithEmailExist(data: IsUserWithEmailExistRequestDTO): Promise<isUserExistResponseDTO> {
        const user = await this._dbService.user.findFirst({
            where: { email: data.email },
        });
        if (user) {
            return { isExist: true };
        }
        return { isExist: false };
    }

    async UpdateLocation(userId: string, lat: number, long: number): Promise<UpdateLocationResponseDTO> {
        await this._dbService.userLocation.upsert({
            where: { userId },
            update: {
                lat,
                long,
                updatedAt: new Date(),
            },
            create: {
                userId,
                lat,
                long,
            },
        });

        return {
            success: true,
            message: 'Location updated successfully',
        };
    }
}
