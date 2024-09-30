import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as swaggerUi from 'swagger-ui-express';

export default function InjectSwagger(app: INestApplication) {
  const v1Options = new DocumentBuilder()
    .setTitle('API')
    .setVersion('1.0')
    .addSecurity('authorization', {
      type: 'apiKey',
      description: 'API Authorization',
      name: 'authorization',
      in: 'header',
    })
    .build();

  const v1Document = SwaggerModule.createDocument(app, v1Options);
  app.use(
    '/v1/api',
    swaggerUi.serve,
    swaggerUi.setup(v1Document, {
      swaggerOptions: {
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
        defaultModelsExpandDepth: -1,
        persistAuthorization: true,
      },
    }),
  )
  SwaggerModule.setup('/v1/api', app, v1Document);
}
