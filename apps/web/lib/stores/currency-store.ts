import { create } from 'zustand'

export type Currency = 'NGN' | 'USD' | 'GBP' | 'CAD'

export interface CurrencyOption {
  code: Currency
  label: string
}

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: 'NGN', label: 'NGN — Nigerian Naira' },
  { code: 'USD', label: 'USD — US Dollar' },
  { code: 'GBP', label: 'GBP — British Pound' },
  { code: 'CAD', label: 'CAD — Canadian Dollar' },
]

const CURRENCY_KEY = 'theokallia_currency'
const COUNTRY_KEY = 'theokallia_country'

// Country-to-currency mapping (build-plan §3.2)
const COUNTRY_CURRENCY: Record<string, Currency> = {
  NG: 'NGN',
  US: 'USD',
  GB: 'GBP',
  CA: 'CAD',
}

// Other African countries fall back to the base NGN market
const AFRICAN_COUNTRIES = new Set([
  'DZ', 'AO', 'BJ', 'BW', 'BF', 'BI', 'CV', 'CM', 'CF', 'TD', 'KM', 'CD', 'CG',
  'CI', 'DJ', 'EG', 'GQ', 'ER', 'SZ', 'ET', 'GA', 'GM', 'GH', 'GN', 'GW', 'KE',
  'LS', 'LR', 'LY', 'MG', 'MW', 'ML', 'MR', 'MU', 'MA', 'MZ', 'NA', 'NE', 'NG',
  'RW', 'ST', 'SN', 'SC', 'SL', 'SO', 'ZA', 'SS', 'SD', 'TZ', 'TG', 'TN', 'UG',
  'ZM', 'ZW',
])

/**
 * Maps a detected ISO country code to a currency.
 * Unknown or missing country falls back to the base NGN market;
 * every other recognised country outside the table uses USD.
 */
export function resolveCurrencyFromCountry(country?: string | null): Currency {
  if (!country) return 'NGN'

  const code = country.trim().toUpperCase()
  if (COUNTRY_CURRENCY[code]) return COUNTRY_CURRENCY[code]
  if (AFRICAN_COUNTRIES.has(code)) return 'NGN'
  return 'USD'
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  const value = match?.[1]
  return value ? decodeURIComponent(value) : null
}

function isCurrency(value: string | null): value is Currency {
  return !!value && CURRENCY_OPTIONS.some((option) => option.code === value)
}

interface CurrencyState {
  currency: Currency
  setCurrency: (currency: Currency) => void
  hydrate: () => void
}

export const useCurrencyStore = create<CurrencyState>((set) => ({
  // server-safe default — hydrate() resolves the real value on the client
  currency: 'NGN',

  /**
   * Sets the active currency and persists it to localStorage and a
   * site-wide cookie so the manual choice overrides geo detection.
   */
  setCurrency: (currency) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CURRENCY_KEY, currency)
      document.cookie = `${CURRENCY_KEY}=${currency}; path=/; max-age=31536000; samesite=lax`
    }
    set({ currency })
  },

  /**
   * Resolves the initial currency client-side:
   * persisted choice → cookie → detected country → NGN default.
   * Must be called client-side only — localStorage is not available on the server.
   */
  hydrate: () => {
    if (typeof window === 'undefined') return

    const stored = localStorage.getItem(CURRENCY_KEY)
    if (isCurrency(stored)) {
      set({ currency: stored })
      return
    }

    const cookieCurrency = readCookie(CURRENCY_KEY)
    if (isCurrency(cookieCurrency)) {
      set({ currency: cookieCurrency })
      return
    }

    set({ currency: resolveCurrencyFromCountry(readCookie(COUNTRY_KEY)) })
  },
}))
