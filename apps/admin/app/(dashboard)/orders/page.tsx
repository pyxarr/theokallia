'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { Eye } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { useAdminOrders, type AdminOrderStatus } from '@/lib/hooks/use-admin-orders'

const statusFilters: { label: string; value: AdminOrderStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Paid', value: 'paid' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
]

function statusVariant(status: AdminOrderStatus) {
  if (status === 'paid') return 'default'
  if (status === 'shipped') return 'secondary'
  if (status === 'delivered') return 'outline'
  return 'secondary'
}

export default function OrdersPage() {
  const [status, setStatus] = useState<AdminOrderStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const filters = status === 'all' ? {} : { status }
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useAdminOrders(filters)

  const orders = (data?.pages.flatMap((page) => page.data) ?? []).filter((order) => {
    const query = search.trim().toLowerCase()
    if (!query) return true
    const name = `${order.user.firstName} ${order.user.lastName}`.toLowerCase()
    return name.includes(query) || order.id.toLowerCase().includes(query)
  })
  const totalCount = data?.pages[0]?.meta.total ?? 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-le-jour text-3xl tracking-wide uppercase">Orders</h1>
          <p className="text-sm text-muted-foreground">
            {totalCount} order{totalCount === 1 ? '' : 's'} total
          </p>
        </div>
        <Select
          value={status}
          onValueChange={(value) => setStatus(value as AdminOrderStatus | 'all')}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            {statusFilters.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="Search customer or order id…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full sm:max-w-xs"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fulfilment queue</CardTitle>
          <CardDescription>Select an order to update its status and tracking.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Loading orders…
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No orders found.
                  </TableCell>
                </TableRow>
              )}
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="relative size-10 shrink-0 overflow-hidden bg-muted">
                        {order.items[0]?.product.assets[0]?.publicId && (
                          <Image
                            src={order.items[0].product.assets[0].publicId}
                            alt={order.items[0].product.name}
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-mono text-xs">
                          …{order.id.slice(-8).toUpperCase()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString('en-NG')}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">
                      {order.user.firstName} {order.user.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{order.user.email}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(order.status)}>{order.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ₦{order.total.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="icon">
                      <Link href={`/orders/${order.id}`} aria-label="View order">
                        <Eye className="size-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {hasNextPage && (
            <div className="mt-4 flex justify-center">
              <Button variant="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                {isFetchingNextPage ? 'Loading…' : 'Load more'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

