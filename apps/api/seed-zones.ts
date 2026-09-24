import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding shipping zones and site config...')

  // Upsert default shipping zones
  await prisma.shippingZone.upsert({
    where: { name: 'Lagos' },
    update: { rate: 3000.0, active: true },
    create: { name: 'Lagos', rate: 3000.0, active: true },
  })

  await prisma.shippingZone.upsert({
    where: { name: 'Nationwide' },
    update: { rate: 6000.0, active: true },
    create: { name: 'Nationwide', rate: 6000.0, active: true },
  })

  await prisma.shippingZone.upsert({
    where: { name: 'International' },
    update: { rate: 35000.0, active: true },
    create: { name: 'International', rate: 35000.0, active: true },
  })

  console.log('Shipping zones seeded.')

  // Create SiteConfig only if it does not already exist
  const existing = await prisma.siteConfig.findFirst()

  if (!existing) {
    await prisma.siteConfig.create({
      data: {
        vipOrderThreshold: 3,
        vipSpendThreshold: 200000,
        welcomeDiscountPercent: 10,
        welcomeDiscountMinOrder: 20000,
        welcomeDiscountExpiry: 30,
      },
    })
    console.log('SiteConfig created with defaults.')
  } else {
    console.log('SiteConfig already exists, skipping.')
  }

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