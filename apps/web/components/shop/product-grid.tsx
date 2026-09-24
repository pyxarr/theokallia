'use client'

import React, { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import ProductCard from './product-card'
import { useProducts } from '@/lib/hooks/use-products'

const ProductGrid = () => {
  const searchParams = useSearchParams()

  const filters = useMemo(() => ({
    category: searchParams.get('category') ?? undefined,
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    sort: (searchParams.get('sort') as 'best-seller' | 'new-arrival') ?? undefined,
    order: (searchParams.get('order') as 'asc' | 'desc') ?? undefined,
  }), [searchParams])

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useProducts(filters)

  const products = data?.pages.flatMap((page) => page.data) ?? []

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <p className="font-cormorant-garamond text-xl text-gray-400">
          Loading...
        </p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <p className="font-cormorant-garamond text-xl text-gray-400">
          Something went wrong. Please try again.
        </p>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <p className="font-cormorant-garamond text-xl text-gray-400">
          No products found.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-10">
      <div className="grid grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {hasNextPage && (
        <div className="flex justify-center">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="font-cormorant-garamond text-sm font-light tracking-wide underline underline-offset-4 disabled:opacity-50"
          >
            {isFetchingNextPage ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  )
}

export default ProductGrid