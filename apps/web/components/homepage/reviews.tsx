import { Star } from 'lucide-react'

const reviews = [
  {
    name: 'Esther Howard',
    rating: 3,
    review:
      'The craftsmanship is absolutely stunning. The moment I opened the box, I knew this piece would be something I treasure forever',
    image: null,
  },
  {
    name: 'Sophia L',
    rating: 4,
    review:
      "Elegant, timeless, and beautifully made. I've received so many compliments every time I wear my necklace",
    image: null,
  },
  {
    name: 'Isabella M',
    rating: 5,
    review:
      'From the packaging to the quality of the jewelry, everything felt luxurious. It truly exceeded my expectations',
    image: null,
  },
]

const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={16}
          className={
            i < rating
              ? 'fill-purple-600 text-purple-600'
              : 'fill-purple-100 text-purple-100'
          }
        />
      ))}
    </div>
  )
}

const Reviews = () => {
  return (
    <section className="container mx-auto my-10 flex flex-col items-center">
      <div className="flex w-full flex-col items-center bg-neutral-25 p-20">
        <h3 className="mb-10 font-le-jour text-3xl text-primary">
          Loved by Our Customers
        </h3>

        <div className="grid grid-cols-3 gap-6">
          {reviews.map((review) => (
            <div
              key={review.name}
              className="max-w-xs bg-white p-6 font-cormorant-garamond"
            >
              {/* Header */}
              <div className="mb-6 flex items-center gap-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden">
                  {/* <Image
                    src={review.image ||}
                    alt={review.name}
                    fill
                    sizes="64px"
                    className="object-cover object-center"
                  /> */}
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-lg font-extralight text-gray-800">
                    {review.name}
                  </span>
                  <StarRating rating={review.rating} />
                </div>
              </div>

              {/* Review text */}
              <p className="font-cormorant-garamond text-base font-extralight text-gray-700">
                {review.review}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Reviews
