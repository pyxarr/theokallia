'use client'

import { Globe } from 'lucide-react'
import { CURRENCY_OPTIONS, useCurrencyStore, type Currency } from '@/lib/stores/currency-store'

/**
 * Navbar currency selector. Persists the choice to localStorage and a cookie
 * so a manual selection overrides geo-based detection on later visits.
 */
const CurrencySwitcher = () => {
  const { currency, setCurrency } = useCurrencyStore()

  return (
    <div className="flex items-center gap-2">
      <Globe size={18} strokeWidth={1.5} className="text-foreground" />
      <select
        aria-label="Select currency"
        value={currency}
        onChange={(event) => setCurrency(event.target.value as Currency)}
        className="cursor-pointer appearance-none bg-transparent text-base text-foreground outline-none"
      >
        {CURRENCY_OPTIONS.map((option) => (
          <option key={option.code} value={option.code}>
            {option.code}
          </option>
        ))}
      </select>
    </div>
  )
}

export default CurrencySwitcher
