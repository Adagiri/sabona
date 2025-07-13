import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { redisStore } from 'cache-manager-redis-yet';
import AppConfig from '../../configs/app.config';
import RedisService from './redis.service';
import { RedisClientOptions } from 'redis';
import { APP_ENV } from 'src/constants';

@Module({
    imports: [
        CacheModule.register<RedisClientOptions>({
            isGlobal: true,
            store: redisStore,
            url: `${AppConfig.APP.ENV === APP_ENV.PROD ? 'rediss' : 'redis'}://${AppConfig.REDIS.HOST}:${AppConfig.REDIS.PORT}`,
        }),
    ],
    exports: [RedisService],
    providers: [RedisService],
})
export default class RedisModule {}
