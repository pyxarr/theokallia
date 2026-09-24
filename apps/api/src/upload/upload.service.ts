import { Injectable, NotFoundException, InternalServerErrorException, Logger } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CloudinaryProvider } from './providers/cloudinary.provider'
import { SignUploadDto } from './dto/sign-upload.dto'
import { ConfirmUploadDto } from './dto/confirm-upload.dto'

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryProvider: CloudinaryProvider,
  ) {}

  /**
   * Validates file metadata and returns a Cloudinary signed signature.
   * The client uses this signature to upload directly to Cloudinary — server never touches image bytes.
   */
  async signUpload(dto: SignUploadDto) {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedMimeTypes.includes(dto.mimeType)) {
      throw new InternalServerErrorException('Unsupported file type. Only JPEG, PNG and WebP are allowed.')
    }

    const MAX_FILE_SIZE = 10 * 1024 * 1024
    if (dto.fileSize > MAX_FILE_SIZE) {
      throw new InternalServerErrorException('File size exceeds the 10MB limit.')
    }

    return this.cloudinaryProvider.signUpload(dto)
  }

  /**
   * Links a completed Cloudinary upload to an entity in the database.
   * Called after the frontend finishes the direct upload — only the publicId crosses the wire.
   * entityType/entityId enables the same endpoint for Products, ContentBlocks, and Categories.
   */
  async confirmUpload(dto: ConfirmUploadDto) {
    const { entityId, entityType, publicId, altText } = dto

    try {
      const asset = await this.prisma.client.asset.create({
        data: {
          publicId,
          altText,
          entityType,
          entityId,
          sortOrder: 0,
          resourceType: 'image',
        },
      })

      return asset
    } catch (error) {
      this.logger.error(`Failed to confirm upload for ${entityType} ${entityId}: ${(error as Error).message}`)
      throw new InternalServerErrorException('Failed to save image reference to database')
    }
  }

  /**
   * Atomically removes an image from both Cloudinary and the database.
   * Cloudinary deletion runs first — if it fails, the DB record is preserved to avoid orphaned files.
   */
  async deleteUpload(id: string) {
    const asset = await this.prisma.client.asset.findUnique({
      where: { id },
    })

    if (!asset) {
      throw new NotFoundException('Asset not found')
    }

    try {
      await this.cloudinaryProvider.deleteAsset(asset.publicId)

      return await this.prisma.client.asset.delete({
        where: { id },
      })
    } catch (error) {
      this.logger.error(`Failed to delete upload ${id}: ${(error as Error).message}`)
      throw new InternalServerErrorException('Failed to delete image asset')
    }
  }
}
