export interface ChunkUploadResponse {
  message: string;
  complete: boolean;
  uploadId?: string;
  filePath?: string;
}
