'use client'

import ProductCard from '@/components/shop/product-card'
import { useSimilarProducts } from '@/lib/hooks/use-products'

interface SimilarProductsProps {
  slug: string
}

const SimilarProducts = ({ slug }: SimilarProductsProps) => {
  const { data: similarProducts, isLoading, isError } = useSimilarProducts(slug)

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 font-cormorant-garamond">
        <h2 className="text-2xl font-semibold text-gray-900">
          Similar products
        </h2>
        <div className="flex items-center justify-center py-10">
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (isError || !similarProducts || similarProducts.length === 0) {
    return (
      <div className="flex flex-col gap-6 font-cormorant-garamond">
        <h2 className="text-2xl font-semibold text-gray-900">
          Similar products
        </h2>
        <div className="flex items-center justify-center py-10">
          <p className="text-gray-400">No similar products found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 font-cormorant-garamond">
      <h2 className="text-2xl font-semibold text-gray-900">Similar products</h2>

      <div className="grid grid-cols-3 gap-6">
        {similarProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}

export default SimilarProducts