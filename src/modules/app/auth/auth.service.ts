import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import RedisService from '../../../core/cache/redis.service';
import DatabaseService from '../../../database/database.service';
import { User, Vendor } from '@prisma/client';
import AppConfig from '../../../configs/app.config';

export class AuthModel {
    id: string;
    user: User | Vendor | null;

    constructor(id: string, user?: User) {
        this.id = id;
        if (user) {
            this.user = user;
        }
    }
}

@Injectable()
export default class AuthService {
    constructor(
        private _cacheService: RedisService,
        private _databaseService: DatabaseService,
    ) {}

    private _generateToken() {
        return uuid();
    }

    async CreateSession(userId: string): Promise<string> {
        const Token = this._generateToken();
        const Auth = new AuthModel(userId);
        await this._cacheService.Set(Token, Auth, AppConfig.APP.TOKEN_EXPIRATION || 604800);
        return Token;
    }

    async GetSession(token: string): Promise<AuthModel> {
        const Auth: AuthModel = await this._cacheService.Get(token);
        if (!Auth) return null;
        Auth.user = await this._databaseService.user.findFirst({
            where: { id: Auth.id },
        });
console.log(Auth.user)
        if (!Auth.user) {
            Auth.user = await this._databaseService.vendor.findFirst({
                where: { id: Auth.id },
            });
        }

        return Auth;
    }
}
