'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Crown, Star } from 'lucide-react'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  useAdminCustomer,
  useSetCustomerVip,
  type ModerationStatus,
} from '@/lib/hooks/use-admin-customers'
import { errorMessage } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function orderStatusVariant(status: string) {
  if (status === 'paid') return 'default'
  if (status === 'delivered') return 'outline'
  return 'secondary'
}

function reviewStatusVariant(status: ModerationStatus) {
  if (status === 'approved') return 'default'
  if (status === 'rejected') return 'outline'
  return 'secondary'
}

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>()
  const id = typeof params.id === 'string' ? params.id : undefined

  const { data: customer, isLoading } = useAdminCustomer(id)
  const { mutateAsync: setVip, isPending: isUpdatingVip } = useSetCustomerVip()

  const [vipConfirm, setVipConfirm] = useState<{ next: boolean } | null>(null)

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading customer…</p>
  }

  if (!customer) {
    return <p className="text-sm text-muted-foreground">Customer not found.</p>
  }

  const handleVipToggle = async () => {
    const next = !customer.isVip
    setVipConfirm({ next })
  }

  const handleConfirmVipToggle = async () => {
    if (!vipConfirm) return
    try {
      await setVip({ id: customer.id, isVip: vipConfirm.next })
      toast.success(vipConfirm.next ? 'Customer marked as VIP' : 'VIP status removed')
      setVipConfirm(null)
    } catch (err) {
      toast.error(errorMessage(err, 'VIP update failed'))
      setVipConfirm(null)
    }
  }

  const stats = [
    { label: 'Orders', value: String(customer.stats.ordersCount) },
    {
      label: 'Lifetime spend',
      value: `₦${customer.stats.lifetimeSpend.toLocaleString()}`,
    },
    { label: 'Reviews', value: String(customer.stats.reviewsCount) },
    { label: 'Items in bag', value: String(customer.cartItemsCount) },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-le-jour text-3xl tracking-wide uppercase">
            {customer.firstName} {customer.lastName}
          </h1>
          <p className="text-sm text-muted-foreground">
            Joined {formatDate(customer.createdAt)}
            {customer.stats.lastOrderAt
              ? ` · last order ${formatDate(customer.stats.lastOrderAt)}`
              : ' · no orders yet'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {customer.isVip && (
            <Badge className="gap-1 bg-[#F3E8FF] text-[#7E22CE]">
              <Crown className="size-3" /> VIP
            </Badge>
          )}
          {customer.role === 'admin' && <Badge variant="outline">Staff</Badge>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-le-jour text-2xl">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            <p className="font-medium">{customer.email}</p>
            {customer.phone && (
              <p className="text-muted-foreground">{customer.phone}</p>
            )}
            {customer.address && (
              <p className="text-muted-foreground">{customer.address}</p>
            )}
            <p className="mt-1">
              {customer.emailVerified ? (
                <Badge variant="outline">Email verified</Badge>
              ) : (
                <Badge variant="secondary">Email unverified</Badge>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Newsletter</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {customer.subscriber ? (
              <>
                <div className="flex flex-wrap gap-1">
                  {customer.subscriber.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <p className="text-muted-foreground">
                  {customer.subscriber.active ? 'Subscribed' : 'Unsubscribed'} ·{' '}
                  {formatDate(customer.subscriber.createdAt)}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">
                Not on the newsletter list.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>VIP status</CardTitle>
            <CardDescription>
              Manual override — VIP is normally granted automatically at the
              order-count or lifetime-spend threshold.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm">
              {customer.isVip ? 'Currently VIP' : 'Currently not VIP'}
              {customer.vipSince && (
                <span className="text-muted-foreground">
                  {' '}
                  · since {formatDate(customer.vipSince)}
                </span>
              )}
            </p>
            <Button
              variant={customer.isVip ? 'outline' : 'default'}
              disabled={isUpdatingVip}
              onClick={() => void handleVipToggle()}
            >
              {isUpdatingVip
                ? 'Updating…'
                : customer.isVip
                  ? 'Remove VIP status'
                  : 'Make VIP'}
            </Button>
          </CardContent>
        </Card>

      <Dialog open={vipConfirm !== null} onOpenChange={(open) => !open && setVipConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {vipConfirm?.next ? 'Make customer VIP?' : 'Remove VIP status?'}
            </DialogTitle>
            <DialogDescription>
              {vipConfirm?.next
                ? 'Customer will gain VIP privileges and receive the VIP newsletter tag.'
                : 'Customer will lose VIP privileges and the VIP newsletter tag will be removed.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVipConfirm(null)} disabled={isUpdatingVip}>
              Cancel
            </Button>
            <Button
              variant={vipConfirm?.next ? 'default' : 'destructive'}
              onClick={handleConfirmVipToggle}
              disabled={isUpdatingVip}
            >
              {isUpdatingVip ? 'Updating…' : vipConfirm?.next ? 'Make VIP' : 'Remove VIP'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent orders</CardTitle>
          <CardDescription>
            The ten most recent orders placed by this customer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Zone</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customer.recentOrders.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground"
                  >
                    No orders yet.
                  </TableCell>
                </TableRow>
              )}
              {customer.recentOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs">
                    …{order.id.slice(-8).toUpperCase()}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(order.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={orderStatusVariant(order.status)}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {order.shippingZone?.name ?? '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    ₦{order.total.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/orders/${order.id}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reviews</CardTitle>
          <CardDescription>
            All reviews this customer has written, with their moderation status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customer.reviews.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground"
                  >
                    No reviews yet.
                  </TableCell>
                </TableRow>
              )}
              {customer.reviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell className="font-medium">
                    {review.product.name}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1">
                      <Star className="size-3.5 fill-[#FBBF24] text-[#FBBF24]" />
                      {review.rating}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-md">
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {review.comment}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={reviewStatusVariant(review.status)}>
                      {review.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(review.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
