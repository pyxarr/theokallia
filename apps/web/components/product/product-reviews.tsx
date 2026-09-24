import { Card, CardContent } from '@/components/ui/card'

const SharpStar = ({ className }: { className?: string }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    className={className}
  >
    <path
      d="M8 0L9.856 6.114L16 6.116L10.572 9.886L12.428 16L8 12.228L3.572 16L5.428 9.886L0 6.116L6.144 6.114L8 0Z"
      fill="currentColor"
    />
  </svg>
)

interface Review {
  id: string
  name: string
  date: string
  rating: number
  comment: string
}

interface ProductReviewsProps {
  reviews: Review[]
}

const ProductReviews = ({ reviews }: ProductReviewsProps) => {
  return (
    <div className="flex flex-col gap-6 font-cormorant-garamond">
      <h2 className="text-2xl font-semibold text-gray-900">
        Ratings and reviews
      </h2>

      <div className="grid grid-cols-2 gap-4">
        {reviews.map((review) => (
          <Card
            key={review.id}
            className="rounded-none border-gray-400 shadow-none"
          >
            <CardContent className="flex flex-col gap-3 p-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-900">
                  {review.name}
                </span>
                <span className="text-base text-gray-400">{review.date}</span>
              </div>

              {/* Stars */}
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <SharpStar
                    key={i}
                    className={
                      i < review.rating ? 'text-primary' : 'text-gray-200'
                    }
                  />
                ))}
              </div>

              {/* Comment */}
              <p className="text-base leading-relaxed font-light text-gray-900">
                {review.comment}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default ProductReviews
