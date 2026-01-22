import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SeederService } from './seeder/seeder.service';
import { ValidationPipe } from '@nestjs/common';
import { I18nValidationPipe } from 'nestjs-i18n';
import * as dotenv from 'dotenv';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  //cors configration
  const allowedOrigins = [
    process.env.FRONT_ADMIN_URL,
    process.env.FRONT_WEBSITE_URL,
    process.env.FRONTEND_WEBSITE,
  
  ];
  
  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  
  //swaggar init
  const config = new DocumentBuilder()
  .setTitle('My API')
  .setDescription('API documentation')
  .setVersion('1.0')
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'Authorization',
      description: 'Enter JWT token',
      in: 'header',
    },
    'access-token' // this name is used in @ApiBearerAuth()
  )
  .addGlobalParameters({
    name: 'Accept-Language',
    in: 'header',
    description: 'Language preference for the response (en, fr, zh)',
    required: false,
    schema: {
      type: 'string',
      default: 'en',
      enum: ['en', 'fr', 'zh'],
    },
  })
  .build();
  
  dotenv.config();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  //global dto error handling
  app.useGlobalPipes(new I18nValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  // Run seeder on startup
  const seeder = app.get(SeederService);
  await seeder.seedSuperAdmin();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
