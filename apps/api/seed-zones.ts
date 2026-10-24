import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

const prisma = new PrismaClient({ adapter })

// Nigerian states + FCT mapped to shipping zones
const STATE_TO_ZONE = {
  Lagos: 'Lagos',
  // All other states → Nationwide
  Abia: 'Nationwide',
  Adamawa: 'Nationwide',
  Akwa_Ibom: 'Nationwide',
  Anambra: 'Nationwide',
  Bauchi: 'Nationwide',
  Bayelsa: 'Nationwide',
  Benue: 'Nationwide',
  Borno: 'Nationwide',
  Cross_River: 'Nationwide',
  Delta: 'Nationwide',
  Ebonyi: 'Nationwide',
  Edo: 'Nationwide',
  Ekiti: 'Nationwide',
  Enugu: 'Nationwide',
  Gombe: 'Nationwide',
  Imo: 'Nationwide',
  Jigawa: 'Nationwide',
  Kaduna: 'Nationwide',
  Kano: 'Nationwide',
  Katsina: 'Nationwide',
  Kebbi: 'Nationwide',
  Kogi: 'Nationwide',
  Kwara: 'Nationwide',
  Nasarawa: 'Nationwide',
  Niger: 'Nationwide',
  Ogun: 'Nationwide',
  Ondo: 'Nationwide',
  Osun: 'Nationwide',
  Oyo: 'Nationwide',
  Plateau: 'Nationwide',
  Rivers: 'Nationwide',
  Sokoto: 'Nationwide',
  Taraba: 'Nationwide',
  Yobe: 'Nationwide',
  Zamfara: 'Nationwide',
  FCT: 'Nationwide',
}

async function main() {
  console.log('Seeding shipping zones, zone states, and site config...')

  // Upsert default shipping zones.
  // The `update` branches are empty on purpose: an admin may have edited
  // the rate or switched a zone off, and a re-seed must not undo that.
  const [lagosZone, nationwideZone, internationalZone] = await Promise.all([
    prisma.shippingZone.upsert({
      where: { name: 'Lagos' },
      update: {},
      create: { name: 'Lagos', rate: 3000.0, active: true },
    }),
    prisma.shippingZone.upsert({
      where: { name: 'Nationwide' },
      update: {},
      create: { name: 'Nationwide', rate: 6000.0, active: true },
    }),
    prisma.shippingZone.upsert({
      where: { name: 'International' },
      update: {},
      create: { name: 'International', rate: 35000.0, active: true },
    }),
  ])

  console.log('Shipping zones seeded.')

  // Seed zone states (state → zone mapping)
  console.log('Seeding zone states...')
  for (const [state, zoneName] of Object.entries(STATE_TO_ZONE)) {
    const zone = zoneName === 'Lagos' ? lagosZone : nationwideZone
    await prisma.shippingZoneState.upsert({
      where: { shippingZoneId_state: { shippingZoneId: zone.id, state } },
      update: {},
      create: { state, shippingZoneId: zone.id },
    })
  }
  console.log('Zone states seeded.')

  // Create/upsert SiteConfig singleton (id: 'singleton')
  // Deletes any old rows with random IDs, ensures exactly one row exists.
  // The `update` branch is empty on purpose: an admin may have edited the
  // thresholds, and a re-seed must not undo that.
  await prisma.siteConfig.deleteMany({
    where: { id: { not: 'singleton' } },
  })

  await prisma.siteConfig.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton' },
  })
  console.log('SiteConfig singleton ensured.')

  console.log('Done.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })