import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getProduct } from '@/lib/api/products'
import { getReviews } from '@/lib/api/reviews'
import ProductPageClient from '@/components/product/product-page'

interface ProductPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) return { title: 'Product Not Found' }
  return {
    title: `${product.name} | Theokallia`,
    description: product.description.slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.description.slice(0, 160),
      images: product.assets[0]?.publicId ? [product.assets[0].publicId] : [],
      type: 'website',
    },
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params

  const product = await getProduct(slug)
  if (!product) notFound()

  const reviewsData = await getReviews(slug)

  return <ProductPageClient slug={slug} product={product} reviewsData={reviewsData} />
}