import { Module } from '@nestjs/common';
import { ExporterService } from './exporter.service';

@Module({
  providers: [ExporterService],
  exports: [ExporterService],
})
export class ExporterModule {}
