import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

const prisma = new PrismaClient({ adapter })

// 26 Cloudinary publicIds uploaded from local product photos
// You can rename/reorder these on Cloudinary dashboard later
const productImages = [
  'theokallia/products/product-0',
  'theokallia/products/product-1',
  'theokallia/products/product-2',
  'theokallia/products/product-3',
  'theokallia/products/product-4',
  'theokallia/products/product-5',
  'theokallia/products/product-6',
  'theokallia/products/product-7',
  'theokallia/products/product-8',
  'theokallia/products/product-9',
  'theokallia/products/product-10',
  'theokallia/products/product-11',
  'theokallia/products/product-12',
  'theokallia/products/product-13',
  'theokallia/products/product-14',
  'theokallia/products/product-15',
  'theokallia/products/product-16',
  'theokallia/products/product-17',
  'theokallia/products/product-18',
  'theokallia/products/product-19',
  'theokallia/products/product-20',
  'theokallia/products/product-21',
  'theokallia/products/product-22',
  'theokallia/products/product-23',
  'theokallia/products/product-24',
  'theokallia/products/product-25',
]

const products = [
  // RINGS
  {
    name: 'Adaeze',
    slug: 'adaeze-gold-ring',
    description: 'A timeless 18k gold ring adorned with a delicate floral motif. Handcrafted to perfection, the Adaeze ring is a symbol of grace and femininity, ideal for everyday elegance or special occasions.',
    price: 45000,
    images: [productImages[0], productImages[1]],
    inStock: true,
    stock: 15,
    categorySlug: 'rings',
    subcategorySlug: 'gold-rings',
  },
  {
    name: 'Zara',
    slug: 'zara-diamond-ring',
    description: 'A breathtaking diamond solitaire set in lustrous white gold. The Zara ring captures light from every angle, making it the ultimate statement piece for engagements, anniversaries, or simply celebrating yourself.',
    price: 120000,
    images: [productImages[2]],
    inStock: true,
    stock: 8,
    categorySlug: 'rings',
    subcategorySlug: 'diamond-rings',
  },
  {
    name: 'Emeka',
    slug: 'emeka-silver-ring',
    description: 'A sleek, minimalist sterling silver band with a brushed finish. The Emeka ring speaks to understated luxury — clean lines, cool tones, and effortless versatility for the modern woman.',
    price: 18000,
    images: [productImages[3]],
    inStock: true,
    stock: 22,
    categorySlug: 'rings',
    subcategorySlug: 'silver-rings',
  },
  // BRACELETS
  {
    name: 'Temi',
    slug: 'temi-gold-bracelet',
    description: 'A luxurious 18k gold chain bracelet featuring an intricate link pattern inspired by West African textile designs. The Temi bracelet drapes beautifully on the wrist, catching light with every movement.',
    price: 55000,
    images: [productImages[4], productImages[5], productImages[6]],
    inStock: true,
    stock: 12,
    categorySlug: 'bracelets',
    subcategorySlug: 'gold-bracelets',
  },
  {
    name: 'Chisom',
    slug: 'chisom-charm-bracelet',
    description: 'A playful yet refined charm bracelet featuring hand-selected gold and enamel charms. Each charm on the Chisom bracelet tells a story — wear your journey on your wrist.',
    price: 38000,
    images: [productImages[7], productImages[8], productImages[9], productImages[10]],
    inStock: true,
    stock: 18,
    categorySlug: 'bracelets',
    subcategorySlug: 'charm-bracelets',
  },
  {
    name: 'Nkechi',
    slug: 'nkechi-silver-bracelet',
    description: 'A delicate sterling silver tennis bracelet set with sparkling cubic zirconia stones. The Nkechi bracelet offers diamond-like brilliance at an accessible price point, perfect as a gift or personal treat.',
    price: 25000,
    images: [productImages[11], productImages[12], productImages[13]],
    inStock: true,
    stock: 20,
    categorySlug: 'bracelets',
    subcategorySlug: 'silver-bracelets',
  },
  // NECKLACES
  {
    name: 'Amara',
    slug: 'amara-gold-necklace',
    description: 'A stunning 18k gold layered necklace with a dainty adjustable chain. The Amara necklace sits beautifully at the collarbone, adding warmth and radiance to any neckline — day or evening.',
    price: 62000,
    images: [productImages[14], productImages[15]],
    inStock: true,
    stock: 10,
    categorySlug: 'necklaces',
    subcategorySlug: 'gold-necklaces',
  },
  {
    name: 'Obiageli',
    slug: 'obiageli-pendant-necklace',
    description: 'A bold teardrop pendant necklace in 18k rose gold, set with a single cushion-cut amethyst. The Obiageli necklace is a conversation starter — a wearable work of art for the woman who commands attention.',
    price: 85000,
    images: [productImages[16], productImages[17]],
    inStock: true,
    stock: 7,
    categorySlug: 'necklaces',
    subcategorySlug: 'pendant-necklaces',
  },
  {
    name: 'Sade',
    slug: 'sade-silver-necklace',
    description: 'A refined herringbone chain necklace in polished sterling silver. The Sade necklace is minimal, architectural, and endlessly elegant — the kind of piece you wear every single day.',
    price: 22000,
    images: [productImages[18]],
    inStock: true,
    stock: 25,
    categorySlug: 'necklaces',
    subcategorySlug: 'silver-necklaces',
  },
  // EARRINGS
  {
    name: 'Ife',
    slug: 'ife-gold-earrings',
    description: 'Sculptural 18k gold drop earrings inspired by ancient Ife bronze art. Lightweight yet striking, the Ife earrings frame the face beautifully and celebrate the depth of African heritage through fine jewellery.',
    price: 42000,
    images: [productImages[19], productImages[20], productImages[21]],
    inStock: true,
    stock: 14,
    categorySlug: 'earrings',
    subcategorySlug: 'gold-earrings',
  },
  {
    name: 'Folake',
    slug: 'folake-hoop-earrings',
    description: 'Classic oversized hoop earrings in polished 18k gold vermeil. The Folake hoops are the ultimate wardrobe staple — bold enough to stand alone, versatile enough to complement any look.',
    price: 30000,
    images: [productImages[22], productImages[23]],
    inStock: true,
    stock: 30,
    categorySlug: 'earrings',
    subcategorySlug: 'hoop-earrings',
  },
  {
    name: 'Ngozi',
    slug: 'ngozi-silver-earrings',
    description: 'Geometric sterling silver stud earrings with a hammered texture finish. The Ngozi studs are small in size but rich in character — the perfect everyday earring for a woman with refined taste.',
    price: 15000,
    images: [productImages[24], productImages[25]],
    inStock: true,
    stock: 35,
    categorySlug: 'earrings',
    subcategorySlug: 'silver-earrings',
  },
]

async function main() {
  console.log('\n🚀 Seeding products...')

  for (const product of products) {
    const category = await prisma.category.findUnique({ where: { slug: product.categorySlug } })
    const subcategory = await prisma.subcategory.findUnique({ where: { slug: product.subcategorySlug } })

    if (!category || !subcategory) {
      console.error(`❌ Missing category/subcategory for ${product.name}`)
      continue
    }

      const created = await prisma.product.upsert({
        where: { slug: product.slug },
        update: {},
        create: {
          name: product.name,
          slug: product.slug,
          description: product.description,
          price: product.price,
          inStock: product.inStock,
          stock: product.stock,
          categoryId: category.id,
          subcategoryId: subcategory.id,
        },
      })

      await prisma.asset.createMany({
        data: product.images.map((publicId, i) => ({
          publicId,
          altText: `${product.name} image ${i + 1}`,
          sortOrder: i,
          entityType: 'Product',
          entityId: created.id,
        })),
        skipDuplicates: true,
      })
    console.log(`✅ Product: ${product.name}`)
  }

  console.log('\n✨ Product seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
