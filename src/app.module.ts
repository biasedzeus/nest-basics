import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UploadModule } from './upload/upload.module';
import { ParserModule } from './parser/parser.module';
import { ExporterModule } from './exporter/exporter.module';
import { TailorModule } from './tailor/tailor.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    UploadModule,
    ParserModule,
    ExporterModule,
    TailorModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
