'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import {
  CURRENCY_OPTIONS,
  useCurrencyStore,
  type Currency,
} from '@/lib/stores/currency-store'

interface RatesResponse {
  base: 'USD'
  rates: Record<string, number>
  fetchedAt: string
  stale: boolean
}

interface PriceSource {
  usdPrice?: number | null
  gbpPrice?: number | null
}

const SYMBOLS: Record<Currency, string> = {
  NGN: '₦',
  USD: '$',
  GBP: '£',
  CAD: 'CA$',
}

const LOCALES: Record<Currency, string> = {
  NGN: 'en-NG',
  USD: 'en-US',
  GBP: 'en-GB',
  CAD: 'en-CA',
}

// Used only until the rates endpoint responds, so prices never render as NaN
const FALLBACK_RATES: Record<string, number> = { USD: 1, NGN: 1600, GBP: 0.79, CAD: 1.37 }

const fetchRates = async (): Promise<RatesResponse> => {
  const res = await api.get('/currency/rates')
  return res.data
}

/**
 * Storefront currency state plus price conversion and formatting.
 * USD is the conversion pivot: NGN amounts convert via the USD rate,
 * fixed per-product usdPrice/gbpPrice overrides win when present.
 */
export function useCurrency() {
  const { currency, setCurrency } = useCurrencyStore()

  const { data } = useQuery({
    queryKey: ['currency', 'rates'],
    queryFn: fetchRates,
    staleTime: 1000 * 60 * 60 * 12,
    retry: 1,
  })

  const rates = data?.rates ?? FALLBACK_RATES

  /** Safe rate lookup — falls back so conversion never yields NaN. */
  const rate = (code: string): number => rates[code] ?? FALLBACK_RATES[code] ?? 1

  /**
   * Converts an NGN amount into the active currency.
   * When a product supplies a fixed usdPrice/gbpPrice, that value is used instead
   * of the converted one; CAD is always derived from the USD value at runtime.
   */
  const convert = (ngnAmount: number, product?: PriceSource): number => {
    if (currency === 'NGN') return ngnAmount

    const ngnPerUsd = rate('NGN')
    const usd = product?.usdPrice ?? ngnAmount / ngnPerUsd

    if (currency === 'USD') return usd
    if (currency === 'GBP') return product?.gbpPrice ?? usd * rate('GBP')
    return usd * rate('CAD')
  }

  /**
   * Formats a numeric value already expressed in the active currency.
   * Use for line totals: format(convert(unitNgn, product) * quantity).
   */
  const format = (value: number): string => {
    const decimals = currency === 'NGN' ? 0 : 2
    const formatted = value.toLocaleString(LOCALES[currency], {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
    return `${SYMBOLS[currency]}${formatted}`
  }

  /** Converts an NGN amount and formats it in the active currency. */
  const formatPrice = (ngnAmount: number, product?: PriceSource): string =>
    format(convert(ngnAmount, product))

  return { currency, setCurrency, formatPrice, format, convert, rates, options: CURRENCY_OPTIONS }
}
