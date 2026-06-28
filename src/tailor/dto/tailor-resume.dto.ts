import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';

export class TailorResumeDto {
  @IsString()
  @IsNotEmpty()
  uploadId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  jobDescription: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  additionalInstructions?: string;
}
