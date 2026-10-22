/**
 * Resolves a shipping zone name from a delivery address using the database.
 * Zone rates are stored in the ShippingZone database table.
 * This function only determines which zone name applies — the rate is fetched from DB.
 *
 * Rules (evaluated in order):
 * 1. Non-Nigerian country → "International"
 * 2. Nigerian state matched in ShippingZoneState table → zone name from DB
 * 3. Fallback → "Nationwide"
 */
import { PrismaClient } from '@prisma/client'

// Lazy singleton to avoid circular imports
let prisma: PrismaClient
function getPrisma(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient()
  }
  return prisma
}

export async function resolveShippingZone(address: {
  state: string
  country: string
}): Promise<string> {
  const normalizedCountry = address.country.trim().toLowerCase()
  const normalizedState = address.state.trim().toLowerCase()

  // Non-Nigerian country → International
  if (normalizedCountry !== 'nigeria' && normalizedCountry !== 'ng') {
    return 'International'
  }

  // Nigerian state → look up in DB
  //
  // The lookup deliberately does NOT filter on `active`. An inactive zone
  // still has to be found here: `orders.service.ts` refuses the order
  // with a clear "not currently available" message when the zone it
  // resolved is switched off. Filtering the inactive zone out would fall
  // through to the "Nationwide" fallback below and charge the customer
  // the Nationwide rate for a zone that was deliberately switched off.
  const zoneState = await getPrisma().shippingZoneState.findFirst({
    where: {
      state: { equals: normalizedState, mode: 'insensitive' },
    },
    select: { shippingZone: { select: { name: true } } },
  })

  if (zoneState) {
    return zoneState.shippingZone.name
  }

  // Fallback for Nigerian states not explicitly mapped
  return 'Nationwide'
}