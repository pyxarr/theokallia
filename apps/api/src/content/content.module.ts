import { Module } from '@nestjs/common'
import { ContentController } from './content.controller'
import { ContentService } from './content.service'

/**
 * ContentModule manages homepage CMS sections (hero, promotions, banners, featured).
 * Each section is a ContentBlock row with title, subtitle, CTA, and sortOrder.
 * Assets attach polymorphically via the Asset model (entityType = 'ContentBlock').
 *
 * PrismaModule is @Global() so no need to import it here.
 */
@Module({
  controllers: [ContentController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}
