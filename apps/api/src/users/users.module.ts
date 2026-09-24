import { Module } from '@nestjs/common'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'

// PrismaService is not imported here because PrismaModule is @Global()
// It is automatically available to all modules in the app
@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [
    // Export UsersService so other modules can use it
    // e.g. OrdersModule may need to look up a user
    UsersService,
  ],
})
export class UsersModule {}
