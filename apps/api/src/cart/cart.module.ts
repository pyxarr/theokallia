import { Module } from '@nestjs/common'
import { CartController } from './cart.controller'
import { CartService } from './cart.service'

// PrismaModule is @Global() so no need to import it here
@Module({
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService], // exported so OrdersModule can call clearCart after checkout
})
export class CartModule {}