import { Injectable, ExecutionContext } from '@nestjs/common'
import { ThrottlerGuard } from '@nestjs/throttler'

@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const url = request.path ?? ''

    // Better Auth handles its own rate limiting — don't interfere
    if (url.startsWith('/api/auth')) return true

    return super.shouldSkip(context)
  }
}
