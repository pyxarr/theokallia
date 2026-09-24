'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Crown, Eye } from 'lucide-react'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  useAdminCustomers,
  type CustomerRole,
} from '@/lib/hooks/use-admin-customers'

type RoleFilter = CustomerRole | 'all'

const roleTabs: { label: string; value: RoleFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Customers', value: 'customer' },
  { label: 'Staff', value: 'admin' },
]

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function CustomersPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [role, setRole] = useState<RoleFilter>('all')

  // debounce so typing doesn't fire a request per keystroke
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  const filters = {
    ...(debouncedSearch ? { q: debouncedSearch } : {}),
    ...(role === 'all' ? {} : { role }),
  }

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useAdminCustomers(filters)

  const customers = data?.pages.flatMap((page) => page.data) ?? []
  const totalCount = data?.pages[0]?.meta.total ?? 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-le-jour text-3xl tracking-wide uppercase">
            Customers
          </h1>
          <p className="text-sm text-muted-foreground">
            {totalCount} {totalCount === 1 ? 'account' : 'accounts'}
            {debouncedSearch ? ` matching “${debouncedSearch}”` : ''}
          </p>
        </div>
        <Input
          placeholder="Search name or email…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full sm:max-w-xs"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {roleTabs.map((tab) => (
          <Button
            key={tab.value}
            variant={role === tab.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setRole(tab.value)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Directory</CardTitle>
          <CardDescription>
            Lifetime spend counts paid, shipped, and delivered orders only.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Lifetime spend</TableHead>
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
                    Loading customers…
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && customers.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground"
                  >
                    No customers found.
                  </TableCell>
                </TableRow>
              )}
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <p className="font-medium">
                      {customer.firstName} {customer.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {customer.email}
                    </p>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(customer.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    {customer.ordersCount}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ₦{customer.lifetimeSpend.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {customer.isVip && (
                        <Badge className="gap-1 bg-[#F3E8FF] text-[#7E22CE]">
                          <Crown className="size-3" /> VIP
                        </Badge>
                      )}
                      {customer.role === 'admin' && (
                        <Badge variant="outline">Staff</Badge>
                      )}
                      {!customer.emailVerified && (
                        <Badge variant="secondary">Unverified</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="icon">
                      <Link
                        href={`/customers/${customer.id}`}
                        aria-label="View customer"
                      >
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
    </div>
  )
}
