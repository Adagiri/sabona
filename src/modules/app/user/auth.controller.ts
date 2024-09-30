import { ApiController } from '../../../core/decorators';
import UserService from './user.service';

@ApiController({ version: '1', tag: 'auth', path: '/auth' })
export default class AuthController {
    constructor(private _userService: UserService) {}

    // @Post({
    //     path: '/login',
    //     description: 'Login to the application',
    //     response: LoginResponseDTO,
    // })
    // Login(@Body() data: LoginRequestDTO): Promise<LoginResponseDTO> {
    //     return this._userService.Login(data);
    // }

    // @Post({
    //     path: '/signup',
    //     description: 'Signup in the application',
    //     response: SignupResponseDTO,
    // })
    // Signup(@Body() data: SignupRequestDTO): Promise<SignupResponseDTO> {
    //     return this._userService.Signup(data);
    // }

    // @Post({
    //     path: '/forget-password',
    //     description: 'Forget password initiate',
    //     response: ForgetPasswordResponseDTO,
    // })
    // ForgetPassword(@Body() data: ForgetPasswordRequestDTO): Promise<ForgetPasswordResponseDTO> {
    //     return this._userService.ForgetPassword(data);
    // }

    // @Post({
    //     path: '/forget-password/verification',
    //     description: 'Forget password verification',
    //     response: ForgetPasswordVerificationResponseDTO,
    // })
    // ForgetPasswordVerification(
    //     @Body() data: ForgetPasswordVerificationRequestDTO,
    // ): Promise<ForgetPasswordVerificationResponseDTO> {
    //     return this._userService.ForgetPasswordVerification(data);
    // }

}
