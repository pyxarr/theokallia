import { Injectable } from '@nestjs/common'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService {
  // Single PrismaClient instance shared across the entire NestJS app
  private readonly prisma: PrismaClient

  constructor() {
    // Prisma 7 requires an explicit database adapter
    // PrismaPg connects to Neon PostgreSQL using DATABASE_URL from .env
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL!,
    })
    this.prisma = new PrismaClient({ adapter })
  }

  // Expose prisma client methods to all services
  get client(): PrismaClient {
    return this.prisma
  }
}