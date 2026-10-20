'use client'

import { useParams } from 'next/navigation'
import ProductForm from '@/components/products/product-form'

export default function EditProductPage() {
  const params = useParams<{ slug: string }>()
  const slug = typeof params.slug === 'string' ? params.slug : undefined

  return <ProductForm slug={slug} />
}
