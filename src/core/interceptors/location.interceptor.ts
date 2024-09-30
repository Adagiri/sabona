import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
  } from '@nestjs/common';
  import { Observable } from 'rxjs';
  import { map } from 'rxjs/operators';
  import UserService from 'src/modules/app/user/user.service';
  import AuthService, { AuthModel } from 'src/modules/app/auth/auth.service';
  
  @Injectable()
  export class LocationInterceptor implements NestInterceptor {
    constructor(
      private readonly usersService: UserService,
      private _authService: AuthService,
    ) {}
  
    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
      const request = context.switchToHttp().getRequest();
  
      const token = request.headers['authorization'];
      let auth: AuthModel | null = null;
  
      if (token) {
        auth = await this._authService.GetSession(token);
      }
  
      if (!auth || !auth.user) {
      } else {
        request.user = auth.user;
      }
  
      const lat = request.headers['latitude'];
      const long = request.headers['longitude'];
  
      const user = request.user;
  
      if (user && lat && long) {
        await this.usersService.UpdateUserLocation(user.id, lat, long);
      }
  
      return next.handle().pipe(map((data) => data));
    }
  }
  