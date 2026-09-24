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

interface RatingBreakdown {
  5: number
  4: number
  3: number
  2: number
  1: number
}

interface ProductRatingSummaryProps {
  rating: number
  reviewCount: number
  breakdown: RatingBreakdown
}

const ProductRatingSummary = ({
  rating,
  reviewCount,
  breakdown,
}: ProductRatingSummaryProps) => {
  const maxCount = Math.max(...Object.values(breakdown))

  return (
    <div className="flex items-center gap-12 font-cormorant-garamond">
      {/* Big Rating Number */}
      <div className="flex flex-col gap-1">
        <div className="flex items-end gap-1">
          <span className="font-le-jour text-7xl leading-none text-gray-900">
            {rating}
          </span>
          <span className="mb-2 font-le-jour text-lg text-gray-600">/5</span>
        </div>
        <span className="text-lg text-gray-600">{reviewCount} reviews</span>
      </div>

      {/* Breakdown Bars */}
      <div className="flex flex-col gap-2">
        {([5, 4, 3, 2, 1] as const).map((star) => {
          const count = breakdown[star]
          const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0

          return (
            <div key={star} className="flex items-center gap-2">
              {/* Star dot */}
              <span className="text-sm text-primary">
                <SharpStar className="text-primary" />
              </span>
              <span className="w-3 text-right text-sm text-gray-500">
                {star}
              </span>

              {/* Bar */}
              <div className="h-1.5 w-36 overflow-hidden rounded-2xl bg-gray-200">
                <div
                  className="h-full bg-gray-800 transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ProductRatingSummary
