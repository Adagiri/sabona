import { BadRequestException, INestApplication, ValidationPipe } from '@nestjs/common';

export default function InjectPipes(app: INestApplication) {
    app.useGlobalPipes(
        new ValidationPipe({
            validationError: { target: true, value: true },
            whitelist: true,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
            exceptionFactory: (errors) => new BadRequestException(errors),
        }),
    );
}
