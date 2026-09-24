import { Global, Module } from '@nestjs/common'
import { RedisService } from './redis.service'

// @Global makes RedisService available across all modules
// without needing to import RedisModule in each one
// Used for OTP storage in auth and product caching later
@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}