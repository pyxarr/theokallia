import { Module } from '@nestjs/common'
import { ReviewsController } from './reviews.controller'
import { ReviewsService } from './reviews.service'

// PrismaModule and RedisModule are @Global() — no need to import them here
@Module({
  controllers: [ReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
