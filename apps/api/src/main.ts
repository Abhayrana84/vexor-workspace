import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';

async function bootstrap() {
  // Enforce JWT_SECRET configuration on bootstrap
  if (!process.env.JWT_SECRET) {
    console.error('❌ FATAL ERROR: JWT_SECRET environment variable is missing.');
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.use(helmet());
  
  // Register global request validation and input formatting rules
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      const allowedOrigins = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'https://vexoritsolutions.shop',
        'http://vexoritsolutions.shop',
        'https://vexoritsolutions.site',
        'http://vexoritsolutions.site',
      ];
      const isRenderSubdomain = /\.onrender\.com$/.test(new URL(origin).hostname);
      if (allowedOrigins.includes(origin) || isRenderSubdomain) {
        callback(null, true);
      } else {
        callback(null, false); // Block origin without throwing uncaught server errors
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`Vexor API running on: http://localhost:${port}/api`);
}
bootstrap();
