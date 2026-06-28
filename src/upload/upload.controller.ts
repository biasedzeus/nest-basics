import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('chunk')
  @UseInterceptors(
    FileInterceptor('chunk', {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
  )
  async uploadChunk(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({
            fileType: 'application/pdf',
            skipMagicNumbersValidation: true,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
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
