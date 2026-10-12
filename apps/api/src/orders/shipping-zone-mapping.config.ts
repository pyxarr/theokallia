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
  const zoneState = await getPrisma().shippingZoneState.findFirst({
    where: {
      state: { equals: normalizedState, mode: 'insensitive' },
      shippingZone: { active: true },
    },
    select: { shippingZone: { select: { name: true } } },
  })

  if (zoneState) {
    return zoneState.shippingZone.name
  }

  // Fallback for Nigerian states not explicitly mapped
  return 'Nationwide'
}