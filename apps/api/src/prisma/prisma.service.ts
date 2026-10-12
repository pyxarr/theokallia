import { Injectable, OnModuleDestroy } from '@nestjs/common'
import { prisma, PrismaClient } from '../infra/clients'

@Injectable()
export class PrismaService implements OnModuleDestroy {
  // Shared PrismaClient instance from infra/clients
  get client(): PrismaClient {
    return prisma
  }

  // Graceful shutdown — called by NestJS on app close
  async onModuleDestroy() {
    await prisma.$disconnect()
  }
}