'use client'

import { useParams } from 'next/navigation'
import { useState } from 'react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  useAdminOrder,
  useUpdateOrderStatus,
  type AdminOrderStatus,
} from '@/lib/hooks/use-admin-orders'
import {
  nextStatusesFor,
  requiresTrackingNumber,
} from '@/lib/order-transitions'
import { errorMessage } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>()
  const id = typeof params.id === 'string' ? params.id : undefined

  const { data: order, isLoading } = useAdminOrder(id)
  const { mutateAsync: updateStatus, isPending: isUpdating } =
    useUpdateOrderStatus()

  const [nextStatus, setNextStatus] = useState<AdminOrderStatus | ''>('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [confirming, setConfirming] = useState<{
    status: AdminOrderStatus
    tracking: string
  } | null>(null)

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading order…</p>
  }

  if (!order) {
    return <p className="text-sm text-muted-foreground">Order not found.</p>
  }

  // The API only accepts legal transitions from the current status.
  const allowedStatuses = nextStatusesFor(order.status)
  const needsTracking = nextStatus !== '' && requiresTrackingNumber(nextStatus)

  const handleUpdate = async () => {
    if (!nextStatus) {
      toast.error('Choose a status first')
      return
    }
    if (requiresTrackingNumber(nextStatus) && !trackingNumber.trim()) {
      toast.error(
        'A tracking number is required when marking an order as shipped.'
      )
      return
    }
    // open confirmation dialog instead of executing immediately
    setConfirming({ status: nextStatus, tracking: trackingNumber.trim() })
  }

  const handleConfirmUpdate = async () => {
    if (!confirming) return
    try {
      await updateStatus({
        id: order.id,
        status: confirming.status,
        trackingNumber: confirming.tracking || undefined,
      })
      toast.success(`Order marked ${confirming.status}`)
      setTrackingNumber('')
      setNextStatus('')
      setConfirming(null)
    } catch (err) {
      toast.error(errorMessage(err, 'Update failed'))
      setConfirming(null)
    }
  }

  const subtotal = order.total - order.shippingFee + order.discount

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-le-jour text-3xl tracking-wide uppercase">
            Order …{order.id.slice(-8).toUpperCase()}
          </h1>
          <p className="text-sm text-muted-foreground">
            Placed {new Date(order.createdAt).toLocaleDateString('en-NG')}
          </p>
        </div>
        <Badge>{order.status}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            <p className="font-medium">
              {order.user.firstName} {order.user.lastName}
            </p>
            <p className="text-muted-foreground">{order.user.email}</p>
            {order.user.phone && (
              <p className="text-muted-foreground">{order.user.phone}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Delivery</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            {order.shippingAddress ? (
              <>
                <p>{order.shippingAddress.street}</p>
                <p className="text-muted-foreground">
                  {order.shippingAddress.city}, {order.shippingAddress.state},{' '}
                  {order.shippingAddress.country}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">No address recorded.</p>
            )}
            {order.shippingZone && (
              <p className="mt-1 text-muted-foreground">
                Zone: {order.shippingZone.name} (₦
                {order.shippingZone.rate.toLocaleString()})
              </p>
            )}
            {order.trackingNumber && (
              <p className="mt-1">
                Tracking:{' '}
                <span className="font-mono">{order.trackingNumber}</span>
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Line total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.product.name}
                  </TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    ₦{item.price.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    ₦{(item.price * item.quantity).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>₦{subtotal.toLocaleString()}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>−₦{order.discount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>₦{order.shippingFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span>₦{order.total.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Update status</CardTitle>
          <CardDescription>
            {allowedStatuses.length === 0
              ? 'This order is in a final state — no further transitions are available.'
              : 'Only valid next steps are listed. Marking an order shipped requires a tracking number and notifies the customer.'}
          </CardDescription>
        </CardHeader>
        {allowedStatuses.length > 0 && (
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex flex-col gap-2">
              <Label htmlFor="next-status">New status</Label>
              <Select
                value={nextStatus}
                onValueChange={(value) =>
                  setNextStatus(value as AdminOrderStatus)
                }
              >
                <SelectTrigger id="next-status" className="w-52">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {allowedStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {needsTracking && (
              <div className="flex flex-1 flex-col gap-2">
                <Label htmlFor="tracking">Tracking number</Label>
                <Input
                  id="tracking"
                  value={trackingNumber}
                  onChange={(event) => setTrackingNumber(event.target.value)}
                  placeholder="Required when marking shipped"
                />
              </div>
            )}
            <Button
              onClick={() => void handleUpdate()}
              disabled={isUpdating || isUpdating || !nextStatus}
            >
              {isUpdating ? 'Updating…' : 'Update status'}
            </Button>
          </CardContent>
        )}
      </Card>

      <Dialog open={confirming !== null} onOpenChange={(open) => !open && setConfirming(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm status change?</DialogTitle>
            <DialogDescription>
              Order will be marked as <strong>{confirming?.status}</strong>
              {confirming?.tracking
                ? ` with tracking number {confirming.tracking}`
                : ''}
              . This notifies the customer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirming(null)} disabled={isUpdating}>
              Cancel
            </Button>
            <Button variant="default" onClick={handleConfirmUpdate} disabled={isUpdating}>
              {isUpdating ? 'Updating…' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
