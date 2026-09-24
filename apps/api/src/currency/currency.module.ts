import { Module } from '@nestjs/common'
import { CurrencyController } from './currency.controller'
import { CurrencyService } from './currency.service'

/**
 * CurrencyModule provides exchange rates for storefront price conversion.
 * RedisModule is @Global(), so it is not imported here.
 */
@Module({
  controllers: [CurrencyController],
  providers: [CurrencyService],
  exports: [CurrencyService],
})
export class CurrencyModule {}
