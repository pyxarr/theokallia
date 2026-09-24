/**
 * Resolves a shipping zone name from a delivery address.
 * Zone rates are stored in the ShippingZone database table.
 * This function only determines which zone name applies — the rate is fetched from DB.
 *
 * Rules (evaluated in order):
 * 1. Non-Nigerian country → "International"
 * 2. Lagos state → "Lagos"
 * 3. Any other Nigerian state → "Nationwide"
 */
export function resolveShippingZone(address: { state: string; country: string }): string {
  const normalizedCountry = address.country.trim().toLowerCase()
  const normalizedState = address.state.trim().toLowerCase()

  if (normalizedCountry !== 'nigeria' && normalizedCountry !== 'ng') {
    return 'International'
  }

  if (normalizedState === 'lagos') {
    return 'Lagos'
  }

  return 'Nationwide'
}