import {
  Controller,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { UploadService } from './upload.service';
import { SignUploadDto } from './dto/sign-upload.dto';
import { ConfirmUploadDto } from './dto/confirm-upload.dto';

@ApiTags('Uploads')
@Controller('uploads')
@UseGuards(RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('sign')
  @ApiOperation({ summary: 'Get a signed signature for Cloudinary direct upload' })
  async sign(@Body() dto: SignUploadDto) {
    return this.uploadService.signUpload(dto);
  }

  @Post('confirm')
  @ApiOperation({ summary: 'Confirm a successful Cloudinary upload and link it to a product' })
  async confirm(@Body() dto: ConfirmUploadDto) {
    return this.uploadService.confirmUpload(dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an image from Cloudinary and the database' })
  async delete(@Param('id') id: string) {
    return this.uploadService.deleteUpload(id);
  }
}
