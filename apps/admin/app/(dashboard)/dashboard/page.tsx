'use client'

import Link from 'next/link'
import { Package, ShoppingCart, Star, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
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
import { Button } from '@/components/ui/button'
import {
  useAdminMetrics,
  useAdminOrders,
  type AdminOrderStatus,
} from '@/lib/hooks/use-admin-orders'

function statusVariant(status: AdminOrderStatus) {
  if (status === 'paid') return 'default'
  if (status === 'shipped') return 'secondary'
  if (status === 'delivered') return 'outline'
  return 'secondary'
}

export default function DashboardPage() {
  const { data: metrics } = useAdminMetrics()
  const { data: recentOrders } = useAdminOrders({ limit: 5 })

  const cards = [
    {
      title: 'Revenue',
      value: metrics ? `₦${metrics.revenue.toLocaleString()}` : '—',
      description: 'Paid, shipped, and delivered orders',
      icon: ShoppingCart,
    },
    {
      title: 'Active Orders',
      value: metrics ? String(metrics.activeOrders) : '—',
      description: 'Awaiting fulfilment',
      icon: Package,
    },
    {
      title: 'Pending Reviews',
      value: metrics ? String(metrics.pendingReviews) : '—',
      description: 'Awaiting moderation',
      icon: Star,
    },
    {
      title: 'Subscribers',
      value: metrics ? String(metrics.subscribers) : '—',
      description: 'Newsletter list',
      icon: Users,
    },
  ]

  const orders = (recentOrders?.pages.flatMap((page) => page.data) ?? []).slice(
    0,
    5
  )

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-le-jour text-3xl tracking-wide uppercase">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Overview of the Theokallia storefront.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <metric.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="font-le-jour text-2xl">{metric.value}</p>
              <CardDescription className="text-xs">
                {metric.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>
              The five newest orders across all statuses.
            </CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/orders">View all orders</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground"
                  >
                    No orders to display yet.
                  </TableCell>
                </TableRow>
              )}
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs">
                    …{order.id.slice(-8).toUpperCase()}
                  </TableCell>
                  <TableCell>
                    {order.user.firstName} {order.user.lastName}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(order.status)}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    ₦{order.total.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}
