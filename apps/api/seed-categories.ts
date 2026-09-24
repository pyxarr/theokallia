import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

const prisma = new PrismaClient({ adapter })

// Categories
const categories = [
  {
    name: 'Rings',
    slug: 'rings',
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800',
  },
  {
    name: 'Bracelets',
    slug: 'bracelets',
    image: 'https://images.unsplash.com/photo-1573408301185-9519f94804f3?w=800',
  },
  {
    name: 'Necklaces',
    slug: 'necklaces',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800',
  },
  {
    name: 'Earrings',
    slug: 'earrings',
    image: 'https://images.unsplash.com/photo-1608042314453-ae338d682c93?w=800',
  },
]

// Subcategories
const subcategories = [
  // Rings
  {
    name: 'Gold Rings',
    slug: 'gold-rings',
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800',
    categorySlug: 'rings',
  },
  {
    name: 'Diamond Rings',
    slug: 'diamond-rings',
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800',
    categorySlug: 'rings',
  },
  {
    name: 'Silver Rings',
    slug: 'silver-rings',
    image: 'https://images.unsplash.com/photo-1589674781759-c21c37956a44?w=800',
    categorySlug: 'rings',
  },
  // Bracelets
  {
    name: 'Gold Bracelets',
    slug: 'gold-bracelets',
    image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800',
    categorySlug: 'bracelets',
  },
  {
    name: 'Charm Bracelets',
    slug: 'charm-bracelets',
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800',
    categorySlug: 'bracelets',
  },
  {
    name: 'Silver Bracelets',
    slug: 'silver-bracelets',
    image: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=800',
    categorySlug: 'bracelets',
  },
  // Necklaces
  {
    name: 'Gold Necklaces',
    slug: 'gold-necklaces',
    image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800',
    categorySlug: 'necklaces',
  },
  {
    name: 'Pendant Necklaces',
    slug: 'pendant-necklaces',
    image: 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=800',
    categorySlug: 'necklaces',
  },
  {
    name: 'Silver Necklaces',
    slug: 'silver-necklaces',
    image: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=800',
    categorySlug: 'necklaces',
  },
  // Earrings
  {
    name: 'Gold Earrings',
    slug: 'gold-earrings',
    image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800',
    categorySlug: 'earrings',
  },
  {
    name: 'Hoop Earrings',
    slug: 'hoop-earrings',
    image: 'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=800',
    categorySlug: 'earrings',
  },
  {
    name: 'Silver Earrings',
    slug: 'silver-earrings',
    image: 'https://images.unsplash.com/photo-1615655406736-b37892f2a21c?w=800',
    categorySlug: 'earrings',
  },
]

async function main() {
  console.log('\n🚀 Seeding categories...')

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    })
    console.log(`✅ Category: ${cat.name}`)
  }

  console.log('\n🚀 Seeding subcategories...')

  for (const sub of subcategories) {
    const { categorySlug, ...body } = sub
    const category = await prisma.category.findUnique({ where: { slug: categorySlug } })
    
    if (!category) {
      console.error(`❌ Category ${categorySlug} not found for subcategory ${sub.name}`)
      continue
    }

    await prisma.subcategory.upsert({
      where: { slug: sub.slug },
      update: {},
      create: {
        ...body,
        categoryId: category.id,
      },
    })
    console.log(`✅ Subcategory: ${sub.name}`)
  }

  console.log('\n✨ Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
