import { Controller, Get } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { AllowAnonymous } from '@thallesp/nestjs-better-auth'
import { CurrencyService } from './currency.service'

/**
 * Currency controller exposes USD-based exchange rates to the storefront.
 * Public — prices must convert for visitors before they authenticate.
 */
@ApiTags('Currency')
@Controller('currency')
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  /**
   * GET /currency/rates — USD-based rates used for NGN/GBP/CAD conversion.
   */
  @Get('rates')
  @AllowAnonymous()
  @ApiOperation({ summary: 'Get USD-based exchange rates for storefront conversion' })
  getRates() {
    return this.currencyService.getRates()
  }
}
