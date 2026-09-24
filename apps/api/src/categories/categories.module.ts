import { Module } from '@nestjs/common'
import { CategoriesController } from './categories.controller'
import { CategoriesService } from './categories.service'

// PrismaModule is @Global() so no need to import it here
@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService],
  // export CategoriesService so ProductsModule can use it later
  // (e.g. to validate categoryId when creating a product)
  exports: [CategoriesService],
})
export class CategoriesModule {}
