/**
 * Shared infrastructure singletons — single Prisma, Redis, and BullMQ connections
 * used by both NestJS DI (services, modules) and standalone configs (Better Auth).
 */
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import Redis from 'ioredis'
import { Queue } from 'bullmq'

// Shared Prisma adapter + client (single connection pool)
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
export const prisma = new PrismaClient({ adapter })
export type { PrismaClient }

// Shared Redis connection (ioredis)
export const redis = new Redis(process.env.REDIS_URL!)

// Shared BullMQ queues using the shared Redis connection
export const mailQueue = new Queue('mail', { connection: redis })
export const subscribersQueue = new Queue('subscribers', { connection: redis })

// Graceful shutdown for standalone usage (auth.ts, workers)
export const shutdown = async () => {
  await Promise.all([
    prisma.$disconnect(),
    mailQueue.close(),
    subscribersQueue.close(),
    redis.quit(),
  ])
}