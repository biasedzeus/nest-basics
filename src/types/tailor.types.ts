export interface TailorRequest {
  uploadId: string;
  jobDescription: string;
  additionalInstructions?: string;
}

export interface TailorResponse {
  message: string;
  pdfBuffer: Buffer;
}
