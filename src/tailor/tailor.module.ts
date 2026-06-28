import { Module } from '@nestjs/common';
import { TailorController } from './tailor.controller';
import { TailorService } from './tailor.service';
import { ParserModule } from '../parser/parser.module';
import { ExporterModule } from '../exporter/exporter.module';

@Module({
  imports: [ParserModule, ExporterModule],
  controllers: [TailorController],
  providers: [TailorService],
  exports: [TailorService],
})
export class TailorModule {}
