'use client'

import { Globe } from 'lucide-react'
import { CURRENCY_OPTIONS, useCurrencyStore, type Currency } from '@/lib/stores/currency-store'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@theokallia/ui/components/ui/select'

/**
 * Navbar currency selector. Persists the choice to localStorage and a cookie
 * so a manual selection overrides geo-based detection on later visits.
 */
const CurrencySwitcher = () => {
  const { currency, setCurrency } = useCurrencyStore()

  return (
    <div className="flex items-center gap-2">
      <Globe size={18} strokeWidth={1.5} className="text-foreground" />
      <Select
        value={currency}
        onValueChange={(value) => setCurrency(value as Currency)}
      >
        <SelectTrigger className="w-28 bg-transparent text-sm font-sans text-foreground outline-none">
          <SelectValue placeholder="Currency" />
        </SelectTrigger>
        <SelectContent>
          {CURRENCY_OPTIONS.map((option) => (
            <SelectItem key={option.code} value={option.code} className="font-sans">
              {option.code}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export default CurrencySwitcher
