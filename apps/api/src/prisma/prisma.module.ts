import { Global, Module } from '@nestjs/common'
import { PrismaService } from './prisma.service'

// @Global makes PrismaService available across all modules
// without needing to import PrismaModule in each feature module
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}