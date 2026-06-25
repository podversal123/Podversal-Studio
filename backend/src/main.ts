import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.use(require('express').json({ limit: '10mb' }));
  app.use(require('express').urlencoded({ limit: '10mb', extended: true }));

  // Enable CORS so the Next.js frontend can talk to this API
  const frontendUrl = process.env.FRONTEND_URL;
  if (!frontendUrl) throw new Error('FRONTEND_URL env var is required');
  app.enableCors({
    origin: frontendUrl,
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
