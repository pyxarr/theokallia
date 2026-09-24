import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { v2 as cloudinary } from 'cloudinary'
import { StorageProvider, SignUploadParams, SignUploadResult, DeleteResult } from './storage-provider.interface'

@Injectable()
export class CloudinaryProvider implements StorageProvider {
  private readonly logger = new Logger(CloudinaryProvider.name)

  constructor(private config: ConfigService) {
    cloudinary.config({
      cloud_name: this.config.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.config.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.config.get<string>('CLOUDINARY_API_SECRET'),
    })
  }

  async signUpload(_params: SignUploadParams): Promise<SignUploadResult> {
    try {
      const timestamp = Math.round(new Date().getTime() / 1000)
      const uploadPreset = 'theokallia_luxury_preset'

      const signature = cloudinary.utils.api_sign_request(
        { timestamp, upload_preset: uploadPreset },
        this.config.getOrThrow<string>('CLOUDINARY_API_SECRET'),
      )

      return {
        signature,
        timestamp,
        apiKey: this.config.getOrThrow<string>('CLOUDINARY_API_KEY'),
        cloudName: this.config.getOrThrow<string>('CLOUDINARY_CLOUD_NAME'),
        uploadPreset,
      }
    } catch (error) {
      this.logger.error(`Failed to sign upload request: ${(error as Error).message}`)
      throw new InternalServerErrorException('Could not generate upload signature')
    }
  }

  async deleteAsset(publicId: string): Promise<DeleteResult> {
    try {
      const result = await cloudinary.uploader.destroy(publicId)
      if (result.result !== 'ok') {
        this.logger.warn(`Cloudinary could not delete asset ${publicId}: ${result.result}`)
      }
      return result
    } catch (error) {
      this.logger.error(`Failed to delete Cloudinary asset ${publicId}: ${(error as Error).message}`)
      throw new InternalServerErrorException('Failed to delete image from cloud storage')
    }
  }
}
