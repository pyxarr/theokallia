/**
 * Shared Redis and BullMQ singletons — one Redis connection and one instance
 * of each queue, used by NestJS DI and standalone configs (Better Auth).
 */
import Redis from 'ioredis'
import { Queue } from 'bullmq'
import { prisma } from './clients'

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
