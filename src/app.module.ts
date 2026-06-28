import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UploadModule } from './upload/upload.module';
import { ParserModule } from './parser/parser.module';
import { ExporterModule } from './exporter/exporter.module';
import { TailorModule } from './tailor/tailor.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        name: 'short', // Protect against rapid double clicks
        ttl: 1000, // 1 second
        limit: 2, // Max 2 requests per second
      },
      {
        name: 'medium', // General API limit
        ttl: 60000, // 1 minute
        limit: 20, // Max 20 requests per minute
      },
    ]),
    UploadModule,
    ParserModule,
    ExporterModule,
    TailorModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
