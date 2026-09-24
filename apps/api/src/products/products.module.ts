import { Module } from '@nestjs/common'
import { ProductsController } from './products.controller'
import { ProductsService } from './products.service'

// PrismaModule is @Global() so no need to import it here
@Module({
  controllers: [ProductsController],
  providers: [ProductsService],
  // export ProductsService so other modules can use it
  // e.g. OrdersModule needs to check product stock before creating an order
  exports: [ProductsService],
})
export class ProductsModule {}