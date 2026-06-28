import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as pdf from 'pdf-parse';

import { PDFParseModule, PDFParseResult } from '../types/pdf-parse.types';

@Injectable()
export class ParserService {
  async extractText(filePath: string): Promise<string> {
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`File not found at path: ${filePath}`);
    }

    try {
      const dataBuffer = await fs.promises.readFile(filePath);
      const pdfModule = pdf as unknown as PDFParseModule;

      // Support the newer PDFParse class format
      if (pdfModule.PDFParse) {
        const parser = new pdfModule.PDFParse({ data: dataBuffer });
        const result = await parser.getText();
        return result.text || '';
      }

      // Fallback to standard legacy function format
      let pdfFunc:
        ((dataBuffer: Buffer) => Promise<PDFParseResult>) | undefined =
        pdfModule.default;
      if (!pdfFunc && typeof pdf === 'function') {
        pdfFunc = pdf;
      }

      if (typeof pdfFunc === 'function') {
        const result = await pdfFunc(dataBuffer);
        return result.text || '';
      }

      throw new Error(
        'No valid PDF parsing function or class found in pdf-parse',
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Failed to parse PDF: ${message}`);
    }
  }
}
