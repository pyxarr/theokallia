import { Injectable, Logger } from '@nestjs/common'
import { RedisService } from '../redis/redis.service'

export interface CurrencyRates {
  base: 'USD'
  rates: Record<string, number>
  fetchedAt: string
  stale: boolean
}

const CACHE_KEY = 'currency:rates:usd'
const CACHE_TTL_SECONDS = 60 * 60 * 12 // 12 hours
const SOURCE_URL = 'https://open.er-api.com/v6/latest/USD'

// Last-resort rates so the storefront never breaks when the rate provider and
// Redis are both unavailable. Values are approximate and only used as a fallback.
const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  NGN: 1600,
  GBP: 0.79,
  CAD: 1.37,
}

/**
 * Provides USD-based exchange rates for storefront currency conversion.
 * Rates are cached in Redis for 12 hours and refreshed from a free provider.
 * Always resolves: falls back to cached, then hardcoded rates.
 */
@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name)

  constructor(private readonly redis: RedisService) {}

  /**
   * Returns USD-based rates. Serves from Redis when warm; otherwise fetches
   * from the provider. Never throws — degrades to fallback rates.
   */
  async getRates(): Promise<CurrencyRates> {
    const cached = await this.readCache()
    if (cached) {
      return cached
    }

    try {
      const response = await fetch(SOURCE_URL)
      const payload = await response.json()

      if (!response.ok || payload?.result !== 'success' || !payload?.rates) {
        throw new Error('Unexpected rate provider response')
      }

      const rates: Record<string, number> = payload.rates
      const result: CurrencyRates = {
        base: 'USD',
        rates,
        fetchedAt: new Date().toISOString(),
        stale: false,
      }

      await this.writeCache(result)
      return result
    } catch (error) {
      this.logger.warn(`Exchange rate fetch failed, using fallback rates: ${error}`)
      return {
        base: 'USD',
        rates: FALLBACK_RATES,
        fetchedAt: new Date().toISOString(),
        stale: true,
      }
    }
  }

  private async readCache(): Promise<CurrencyRates | null> {
    try {
      const raw = await this.redis.get(CACHE_KEY)
      return raw ? (JSON.parse(raw) as CurrencyRates) : null
    } catch (error) {
      this.logger.warn(`Exchange rate cache read failed: ${error}`)
      return null
    }
  }

  private async writeCache(value: CurrencyRates): Promise<void> {
    try {
      await this.redis.set(CACHE_KEY, JSON.stringify(value), CACHE_TTL_SECONDS)
    } catch (error) {
      this.logger.warn(`Exchange rate cache write failed: ${error}`)
    }
  }
}
