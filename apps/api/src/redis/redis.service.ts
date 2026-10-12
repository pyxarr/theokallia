import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { redis } from '../infra/clients'

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  // Shared Redis connection from infra/clients
  get client() {
    return redis
  }

  onModuleInit() {
    console.log('Redis connected')
  }

  async onModuleDestroy() {
    // Gracefully close the Redis connection when the app shuts down
    await redis.quit()
  }

  // Store a key-value pair with a TTL in seconds
  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    await redis.set(key, value, 'EX', ttlSeconds)
  }

  // Retrieve a value by key — returns null if not found or expired
  async get(key: string): Promise<string | null> {
    return redis.get(key)
  }

  // Delete a key — used after OTP is verified
  async del(key: string): Promise<void> {
    await redis.del(key)
  }
}