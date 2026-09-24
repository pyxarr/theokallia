'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Star } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { useAuthStore } from '@/lib/stores/auth-store'
import { useCreateReview, useReviewEligibility } from '@/lib/hooks/use-reviews'
import { errorMessage } from '@/lib/utils'
import * as z from 'zod'

const reviewFormSchema = z.object({
  rating: z.number().min(1, 'Pick a star rating first').max(5),
  comment: z.string().min(3, 'Your review must be at least 3 characters'),
})

type ReviewFormValues = z.infer<typeof reviewFormSchema>

/**
 * Write-a-review form for the product page. Rendered only when the server
 * confirms the signed-in customer has purchased this product and hasn't
 * reviewed it yet — renders nothing for guests, window-shoppers, and
 * repeat reviewers, mirroring the API's rules before the form can fail.
 */
export default function ReviewForm({ slug }: { slug: string }) {
  const { isAuthenticated } = useAuthStore()
  const { data: eligibility, isLoading } = useReviewEligibility(
    slug,
    isAuthenticated
  )
  const { mutateAsync: createReview, isPending } = useCreateReview(slug)

  const [hovered, setHovered] = useState(0)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: { rating: 0, comment: '' },
  })

  // while the eligibility check is in flight — and for everyone it excludes —
  // the section stays empty
  if (isLoading || !eligibility?.canReview) return null

  const rating = watch('rating', 0)
  const activeStar = hovered || rating

  const onSubmit = async (values: ReviewFormValues) => {
    try {
      await createReview({ rating: values.rating, comment: values.comment.trim() })
      // the review enters the admin moderation queue — it is not public yet
      toast.success('Thank you — your review is awaiting approval.')
      reset({ rating: 0, comment: '' })
    } catch (err) {
      toast.error(errorMessage(err, 'Could not submit your review'))
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4 rounded-none border border-gray-400 p-6 font-cormorant-garamond"
    >
      <h3 className="text-2xl font-semibold text-gray-900">Write a review</h3>

      <div
        className="flex items-center gap-1"
        role="radiogroup"
        aria-label="Your rating"
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={rating === star}
            aria-label={`${star} star${star === 1 ? '' : 's'}`}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setValue('rating', star, { shouldValidate: true })}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star
              size={20}
              className={star <= activeStar ? 'text-primary' : 'text-gray-200'}
            />
          </button>
        ))}
        {errors.rating && (
          <p className="text-xs text-destructive ml-2">{errors.rating.message}</p>
        )}
      </div>

      <Textarea
        {...register('comment')}
        placeholder="Share your thoughts on this piece"
        rows={4}
        disabled={isPending}
      />
      {errors.comment && (
        <p className="text-xs text-destructive">{errors.comment.message}</p>
      )}

      <button
        type="submit"
        disabled={isPending || rating < 1}
        className="w-full bg-[#7E22CE] py-3 text-sm tracking-widest text-white uppercase transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? 'Submitting…' : 'Submit review'}
      </button>
    </form>
  )
}
