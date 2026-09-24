'use client'

import { ViewTransition } from 'react'
import ProductImages from '@/components/product/product-images'
import ProductInfo from '@/components/product/product-info'
import ProductShipping from '@/components/product/product-shipping'
import ProductRatingSummary from '@/components/product/product-rating-summary'
import ProductReviews from '@/components/product/product-reviews'
import ReviewForm from '@/components/product/review-form'
import SimilarProducts from '@/components/product/similar-products'
import { useProduct } from '@/lib/hooks/use-products'
import { useReviews } from '@/lib/hooks/use-reviews'
import type { Product } from '@/lib/hooks/use-products'
import type { ReviewsSummary } from '@/lib/hooks/use-reviews'

interface ProductPageProps {
  slug: string
  product: Product
  reviewsData: ReviewsSummary | null
}

export default function ProductPage({ slug, product: initialProduct, reviewsData: initialReviewsData }: ProductPageProps) {
  const { data: product, isLoading, isError } = useProduct(slug, initialProduct)
  const { data: reviewsData } = useReviews(slug, initialReviewsData)

  if (isLoading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex items-center justify-center py-20">
          <p className="font-cormorant-garamond text-xl text-gray-400">
            Loading...
          </p>
        </div>
      </main>
    )
  }

  if (isError || !product) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex items-center justify-center py-20">
          <p className="font-cormorant-garamond text-xl text-gray-400">
            Product not found.
          </p>
        </div>
      </main>
    )
  }

  return (
    <ViewTransition>
      <main className="mx-auto max-w-6xl px-6 py-12">
        {/* top section — images + info + shipping */}
        <div className="grid grid-cols-2 gap-12">
          <ProductImages
            assets={product.assets}
            productName={product.name}
            slug={slug}
          />

          <div className="flex flex-col gap-6">
            <ProductInfo product={product} />
            <ProductShipping
              shipping={{
                deliveryTime: '3-5 working days',
                courier: 'DHL',
                arrival: '26th - 31st March',
                location: 'Nigeria',
              }}
            />
          </div>
        </div>

        {/* ratings + reviews */}
        <div className="mt-16 flex flex-col gap-8">
          {reviewsData && reviewsData.reviewCount > 0 ? (
            <>
              <ProductRatingSummary
                rating={reviewsData.rating}
                reviewCount={reviewsData.reviewCount}
                breakdown={reviewsData.ratingBreakdown}
              />
              <ProductReviews
                reviews={reviewsData.reviews.map((review) => ({
                  id: review.id,
                  name: `${review.user.firstName} ${review.user.lastName}`,
                  date: new Date(review.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  }),
                  rating: review.rating,
                  comment: review.comment,
                }))}
              />
            </>
          ) : (
            <div className="flex flex-col gap-2">
              <h2 className="font-cormorant-garamond text-2xl font-semibold text-gray-900">
                Ratings and reviews
              </h2>
              <p className="font-cormorant-garamond text-lg text-gray-400">
                No reviews yet. Be the first to share your thoughts.
              </p>
            </div>
          )}

          <ReviewForm slug={slug} />
        </div>

        <div className="mt-16">
          <SimilarProducts slug={slug} />
        </div>
      </main>
    </ViewTransition>
  )
}