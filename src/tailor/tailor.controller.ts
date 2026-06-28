import {
  Controller,
  Post,
  Body,
  BadRequestException,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ParserService } from '../parser/parser.service';
import { TailorService } from './tailor.service';
import { ExporterService } from '../exporter/exporter.service';
import { TailorResumeDto } from './dto/tailor-resume.dto';
import * as path from 'path';
import * as fs from 'fs';
import type { Response } from 'express';

@Controller('resume')
export class TailorController {
  constructor(
    private readonly parserService: ParserService,
    private readonly tailorService: TailorService,
    private readonly exporterService: ExporterService,
  ) {}

  @Throttle({ default: { limit: 2, ttl: 60000 } })
  @Post('tailor')
  async tailorResume(
    @Body() body: TailorResumeDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { uploadId, jobDescription, additionalInstructions } = body;

    const filePath = path.join(process.cwd(), 'uploads', `${uploadId}.pdf`);
    if (!fs.existsSync(filePath)) {
      throw new BadRequestException(
        `No uploaded PDF file found for uploadId: ${uploadId}`,
      );
    }

    // 1. Parse text from the uploaded PDF
    const resumeText = await this.parserService.extractText(filePath);

    // 2. Tailor resume using LLM
    const tailoredMarkdown = await this.tailorService.tailorResume(
      resumeText,
      jobDescription,
      additionalInstructions,
    );

    // 3. Export tailored Markdown to PDF Buffer
    const pdfBuffer =
      await this.exporterService.generatePdfFromMarkdown(tailoredMarkdown);

    // 4. Return as StreamableFile with correct headers
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="tailored_resume.pdf"',
      'Content-Length': pdfBuffer.length.toString(),
    });

    return new StreamableFile(pdfBuffer);
  }
}
