import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis

  constructor(private config: ConfigService) {
    // Connect to Upstash Redis using the URL from .env
    this.client = new Redis(this.config.get<string>('REDIS_URL')!, {
      // Required for Upstash TLS connection (rediss://)
      tls: {},
    })
  }

  onModuleInit() {
    console.log('Redis connected')
  }

  async onModuleDestroy() {
    // Gracefully close the Redis connection when the app shuts down
    await this.client.quit()
  }

  // Store a key-value pair with a TTL in seconds
  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.client.set(key, value, 'EX', ttlSeconds)
  }

  // Retrieve a value by key — returns null if not found or expired
  async get(key: string): Promise<string | null> {
    return this.client.get(key)
  }

  // Delete a key — used after OTP is verified
  async del(key: string): Promise<void> {
    await this.client.del(key)
  }
}