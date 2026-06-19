import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS so the Next.js frontend can talk to this API
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Auto-validate all incoming request bodies using class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,       // strip fields not in DTO
      forbidNonWhitelisted: true,
      transform: true,       // auto-transform types (e.g. string to number)
    }),
  );

  // All API routes will be prefixed with /api
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Podversal API running on: http://localhost:${port}/api`);
}

bootstrap();
