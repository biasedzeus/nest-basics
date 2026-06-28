import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Limit incoming JSON and URL-encoded bodies to 500kb
  app.use(express.json({ limit: '500kb' }));
  app.use(express.urlencoded({ extended: true, limit: '500kb' }));

  // Register global request timeout interceptor
  app.useGlobalInterceptors(new TimeoutInterceptor());

  await app.listen(process.env.PORT ?? 8001);
}
void bootstrap();
