import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';

import { InjectSwagger, InjectPipes, InjectInterceptors } from './core/injectors';

export async function bootstrap() {
    try {
        const { AppModule } = await import('./app.module');
        const AppConfig = (await import('./configs/app.config')).default;
        console.log('🏗️ Bootstrapping Sabonah NestJS Application...');

        const app = await NestFactory.create<NestExpressApplication>(AppModule, {
            rawBody: true,
            cors: true,
        });

        // Configure application
        /* Enable API versioning */
        app.enableVersioning({ type: VersioningType.URI });

        /* Set proxy as trustful to forward IP address */
        app.set('trust proxy', 1);

        /* Add custom Injectors here */
        InjectPipes(app);
        InjectInterceptors(app);
        InjectSwagger(app);

        const port = AppConfig.APP.PORT || 3001;

        /* Start the application on a specified port */
        await app.listen(port);

        // Success messages
        console.log(`🎉 Sabonah Backend is running on http://localhost:${port}`);
        console.log(`📚 API Documentation: http://localhost:${port}/v1/api`);
        console.log(`🌍 Environment: ${AppConfig.APP.ENV}`);

        // Log configuration summary in development
        if (AppConfig.APP.ENV === 'test' && process.env.NODE_ENV === 'development') {
            console.log('🔧 Configuration Summary:');
            console.table({
                Environment: AppConfig.APP.ENV,
                Port: AppConfig.APP.PORT,
                Debug: AppConfig.APP.DEBUG,
                Database: AppConfig.DATABASE.URL ? '✅ Configured' : '❌ Missing',
                Redis: AppConfig.REDIS.HOST ? '✅ Configured' : '❌ Missing',
                AWS_Region: AppConfig.AWS.REGION,
                AWS_Bucket: AppConfig.AWS.BUCKET || 'Not configured',
            });
        }

        return app;
    } catch (error) {
        console.error('❌ Failed to bootstrap application:', error);
        throw error;
    }
}
