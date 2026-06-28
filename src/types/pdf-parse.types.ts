export interface PDFParseResult {
  text: string;
}

export interface PDFParseClassInstance {
  getText(): Promise<PDFParseResult>;
}

export interface PDFParseModule {
  PDFParse?: new (options: { data: Buffer }) => PDFParseClassInstance;
  default?: (dataBuffer: Buffer) => Promise<PDFParseResult>;
}
