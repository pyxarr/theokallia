import { Module } from '@nestjs/common'
import { ReviewsController } from './reviews.controller'
import { ReviewsAdminController } from './reviews-admin.controller'
import { ReviewsService } from './reviews.service'

// PrismaModule and RedisModule are @Global() — no need to import them here
@Module({
  controllers: [ReviewsController, ReviewsAdminController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
