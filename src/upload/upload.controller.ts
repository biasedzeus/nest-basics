import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('chunk')
  @UseInterceptors(FileInterceptor('chunk'))
  async uploadChunk(
    @UploadedFile() file: Express.Multer.File,
    @Body('uploadId') uploadId: string,
    @Body('chunkIndex') chunkIndexStr: string,
    @Body('totalChunks') totalChunksStr: string,
  ) {
    if (!file) {
      throw new BadRequestException('No chunk file uploaded');
    }
    if (!uploadId) {
      throw new BadRequestException('uploadId is required');
    }
    if (chunkIndexStr === undefined || totalChunksStr === undefined) {
      throw new BadRequestException('chunkIndex and totalChunks are required');
    }

    const chunkIndex = parseInt(chunkIndexStr, 10);
    const totalChunks = parseInt(totalChunksStr, 10);

    if (isNaN(chunkIndex) || isNaN(totalChunks)) {
      throw new BadRequestException(
        'chunkIndex and totalChunks must be valid numbers',
      );
    }

    await this.uploadService.saveChunk(uploadId, file.buffer, chunkIndex);

    const isComplete = this.uploadService.areAllChunksPresent(
      uploadId,
      totalChunks,
    );
    if (isComplete) {
      const finalFilePath = await this.uploadService.assembleChunks(
        uploadId,
        totalChunks,
      );
      return {
        message: 'Upload complete',
        complete: true,
        uploadId,
        filePath: finalFilePath,
      };
    }

    return {
      message: `Chunk ${chunkIndex} saved`,
      complete: false,
    };
  }
}
