import { IsString, IsNumber } from 'class-validator';

export class SignUploadDto {
  @IsString()
  fileName: string;

  @IsNumber()
  fileSize: number;

  @IsString()
  mimeType: string;
}
