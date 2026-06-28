import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { marked } from 'marked';
import puppeteer from 'puppeteer';

@Injectable()
export class ExporterService {
  async generatePdfFromMarkdown(markdown: string): Promise<Buffer> {
    try {
      // 1. Convert Markdown to HTML
      const rawHtml = await marked.parse(markdown);

      // 2. Wrap HTML in a template with styles
      const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: 'Arial', 'Helvetica', sans-serif;
      font-size: 10pt;
      line-height: 1.4;
      color: #333333;
      margin: 0;
      padding: 0;
    }
    
    /* Document header style */
    header {
      text-align: center;
      margin-bottom: 15px;
    }
    
    header h1 {
      font-size: 20pt;
      margin: 0 0 5px 0;
      color: #111111;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    header p {
      font-size: 9.5pt;
      margin: 3px 0;
      color: #555555;
    }
    
    /* Section headers styling */
    h1, h2, h3, h4 {
      color: #222222;
      font-weight: bold;
    }
    
    h1 {
      font-size: 16pt;
      border-bottom: 1.5px solid #222222;
      margin-top: 20px;
      margin-bottom: 10px;
      padding-bottom: 3px;
      text-transform: uppercase;
      page-break-after: avoid;
    }
    
    h2 {
      font-size: 12pt;
      margin-top: 15px;
      margin-bottom: 5px;
      page-break-after: avoid;
    }
    
    h3 {
      font-size: 10.5pt;
      margin-top: 10px;
      margin-bottom: 3px;
      page-break-after: avoid;
    }
    
    p {
      margin-top: 0;
      margin-bottom: 8px;
    }
    
    ul, ol {
      margin-top: 0;
      margin-bottom: 10px;
      padding-left: 20px;
    }
    
    li {
      margin-bottom: 4px;
    }
    
    /* Page break handling for clean printing */
    .avoid-break {
      page-break-inside: avoid;
    }
    
    @page {
      size: A4;
      margin: 20mm 15mm 20mm 15mm;
    }
  </style>
</head>
<body>
  <div class="content">
    ${rawHtml}
  </div>
</body>
</html>
      `;

      // 3. Launch Puppeteer and generate PDF
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();
      await page.setContent(fullHtml, { waitUntil: 'domcontentloaded' });

      // Generate PDF buffer
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0px',
          bottom: '0px',
          left: '0px',
          right: '0px',
        },
      });

      await browser.close();

      return Buffer.from(pdfBuffer);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new InternalServerErrorException(
        `Failed to generate PDF: ${message}`,
      );
    }
  }
}
