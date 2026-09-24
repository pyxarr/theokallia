'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Star, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  useAdminReviews,
  useAdminReviewCounts,
  useModerateReview,
  useDeleteReview,
  type AdminReview,
  type AdminReviewStatus,
} from '@/lib/hooks/use-admin-reviews'
import { cn, errorMessage } from '@/lib/utils'

type StatusFilter = AdminReviewStatus | 'all'

const tabs: { label: string; value: StatusFilter }[] = [
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'All', value: 'all' },
]

function statusVariant(status: AdminReviewStatus) {
  if (status === 'approved') return 'default'
  if (status === 'rejected') return 'outline'
  return 'secondary'
}

/** Renders a 1–5 rating as filled and empty stars. */
function Stars({ rating }: { rating: number }) {
  return (
    <span
      className="inline-flex items-center gap-0.5"
      aria-label={`${rating} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={
            star <= rating
              ? 'size-3.5 fill-[#FBBF24] text-[#FBBF24]'
              : 'size-3.5 text-muted-foreground'
          }
        />
      ))}
    </span>
  )
}

/**
 * Review comment cell. Table cells are whitespace-nowrap and max-width on a
 * td is not respected by table layout, so the clamp lives on a div inside the
 * cell — long comments collapse to three lines with a Show more toggle.
 */
function ReviewComment({ comment }: { comment: string }) {
  const [expanded, setExpanded] = useState(false)
  const ref = useRef<HTMLParagraphElement>(null)
  const [overflowing, setOverflowing] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (el) setOverflowing(el.scrollHeight > el.clientHeight + 1)
  }, [comment])

  return (
    <div className="max-w-md">
      <p
        ref={ref}
        className={cn(
          'text-sm whitespace-pre-line text-muted-foreground',
          !expanded && 'line-clamp-3'
        )}
      >
        {comment}
      </p>
      {overflowing && (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="mt-1 text-xs text-[#7E22CE] hover:underline"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  )
}

export default function ReviewsPage() {
  const [status, setStatus] = useState<StatusFilter>('pending')
  const [deleting, setDeleting] = useState<AdminReview | null>(null)

  const filters = status === 'all' ? {} : { status }
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useAdminReviews(filters)
  const { data: counts } = useAdminReviewCounts()
  const { mutateAsync: moderate, isPending: isModerating } = useModerateReview()
  const { mutateAsync: removeReview, isPending: isDeleting } = useDeleteReview()

  const reviews = data?.pages.flatMap((page) => page.data) ?? []
  const totalCount = data?.pages[0]?.meta.total ?? 0
  const countFor = (value: StatusFilter) =>
    value === 'all'
      ? counts
        ? counts.pending + counts.approved + counts.rejected
        : undefined
      : counts?.[value]

  const handleModerate = async (
    review: AdminReview,
    next: Exclude<AdminReviewStatus, 'pending'>
  ) => {
    try {
      await moderate({ id: review.id, status: next })
      toast.success(next === 'approved' ? 'Review approved' : 'Review rejected')
    } catch (err) {
      toast.error(errorMessage(err, 'Moderation failed'))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-le-jour text-3xl tracking-wide uppercase">
          Reviews
        </h1>
        <p className="text-sm text-muted-foreground">
          Only approved reviews appear on the storefront.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const count = countFor(tab.value)
          return (
            <Button
              key={tab.value}
              variant={status === tab.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatus(tab.value)}
            >
              {tab.label}
              {count !== undefined && (
                <Badge variant="secondary" className="ml-2">
                  {count}
                </Badge>
              )}
            </Button>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Moderation queue</CardTitle>
          <CardDescription>
            {totalCount} review{totalCount === 1 ? '' : 's'}
            {status === 'all' ? ' total' : ` ${status}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Reviewer</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground"
                  >
                    Loading reviews…
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && reviews.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground"
                  >
                    No reviews in this queue.
                  </TableCell>
                </TableRow>
              )}
              {reviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell className="font-medium">
                    {review.product.name}
                  </TableCell>
                  <TableCell>
                    <p>
                      {review.user.firstName} {review.user.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {review.user.email}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Stars rating={review.rating} />
                  </TableCell>
                  <TableCell>
                    <ReviewComment comment={review.comment} />
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(review.status)}>
                      {review.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {review.status !== 'approved' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Approve review"
                          disabled={isModerating}
                          onClick={() =>
                            void handleModerate(review, 'approved')
                          }
                        >
                          <Check className="size-4 text-green-600" />
                        </Button>
                      )}
                      {review.status !== 'rejected' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Reject review"
                          disabled={isModerating}
                          onClick={() =>
                            void handleModerate(review, 'rejected')
                          }
                        >
                          <X className="size-4 text-destructive" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete review"
                        onClick={() => setDeleting(review)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {hasNextPage && (
            <div className="mt-4 flex justify-center">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? 'Loading…' : 'Load more'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete review?</DialogTitle>
            <DialogDescription>
              This permanently removes the review by {deleting?.user.firstName}{' '}
              {deleting?.user.lastName} on “{deleting?.product.name}”. This
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleting(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isDeleting}
              onClick={async () => {
                if (!deleting) return
                try {
                  await removeReview(deleting.id)
                  toast.success('Review deleted')
                } catch (err) {
                  toast.error(errorMessage(err, 'Delete failed'))
                } finally {
                  setDeleting(null)
                }
              }}
            >
              {isDeleting ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
