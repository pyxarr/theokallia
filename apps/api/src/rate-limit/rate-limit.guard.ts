import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { SKIP_RATE_LIMIT_KEY } from './skip-rate-limit.decorator'

@Injectable()
export class RateLimitGuard implements CanActivate {
  private ratelimit: Ratelimit

  constructor(private reflector: Reflector) {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })

    this.ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '1 m'),
      analytics: true,
      prefix: 'theokallia:ratelimit',
    })
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (skip) return true

    const request = context.switchToHttp().getRequest()
    const url = request.path ?? ''

    // Better Auth handles its own rate limiting — don't interfere
    if (url.startsWith('/api/auth')) return true

    const forwarded = (request.headers['x-forwarded-for'] as string) ?? ''
    const ip = forwarded.split(',')[0]?.trim() ?? request.ip ?? 'unknown'

    const { success, reset } = await this.ratelimit.limit(ip)

    if (!success) {
      const response = context.switchToHttp().getResponse()
      const retryAfter = Math.ceil((reset - Date.now()) / 1000)
      response.header('Retry-After', Math.max(1, retryAfter))
      throw new HttpException('Too Many Requests', HttpStatus.TOO_MANY_REQUESTS)
    }

    return true
  }
}
