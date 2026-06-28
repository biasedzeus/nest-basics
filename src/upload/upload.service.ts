import { Injectable, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');
  private readonly chunksDir = path.join(this.uploadDir, 'chunks');

  constructor() {
    // Ensure upload and chunks directories exist
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
    if (!fs.existsSync(this.chunksDir)) {
      fs.mkdirSync(this.chunksDir, { recursive: true });
    }
  }

  async saveChunk(
    uploadId: string,
    buffer: Buffer,
    index: number,
  ): Promise<void> {
    const chunkFolder = path.join(this.chunksDir, uploadId);
    if (!fs.existsSync(chunkFolder)) {
      fs.mkdirSync(chunkFolder, { recursive: true });
    }

    const chunkPath = path.join(chunkFolder, index.toString());
    await fs.promises.writeFile(chunkPath, buffer);
  }

  areAllChunksPresent(uploadId: string, totalChunks: number): boolean {
    const chunkFolder = path.join(this.chunksDir, uploadId);
    if (!fs.existsSync(chunkFolder)) {
      return false;
    }

    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(chunkFolder, i.toString());
      if (!fs.existsSync(chunkPath)) {
        return false;
      }
    }
    return true;
  }

  async assembleChunks(uploadId: string, totalChunks: number): Promise<string> {
    const chunkFolder = path.join(this.chunksDir, uploadId);
    const finalFilePath = path.join(this.uploadDir, `${uploadId}.pdf`);

    // Verify all chunks are present
    const ready = this.areAllChunksPresent(uploadId, totalChunks);
    if (!ready) {
      throw new BadRequestException('Not all chunks are uploaded yet');
    }

    const writeStream = fs.createWriteStream(finalFilePath);

    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(chunkFolder, i.toString());
      const data = await fs.promises.readFile(chunkPath);
      await new Promise<void>((resolve, reject) => {
        writeStream.write(data, (err) => {
          if (err) {
            reject(err instanceof Error ? err : new Error(String(err)));
          } else {
            resolve();
          }
        });
      });
    }

    await new Promise<void>((resolve, reject) => {
      writeStream.end((err: unknown) => {
        if (err) {
          let errMsg = 'Unknown write stream error';
          if (err instanceof Error) {
            errMsg = err.message;
          } else if (typeof err === 'string') {
            errMsg = err;
          }
          reject(err instanceof Error ? err : new Error(errMsg));
        } else {
          resolve();
        }
      });
    });

    // Cleanup chunks directory
    await fs.promises.rm(chunkFolder, { recursive: true, force: true });

    return finalFilePath;
  }
}
