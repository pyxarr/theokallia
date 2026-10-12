'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Power, PowerOff, Trash2 } from 'lucide-react'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  useAdminCoupons,
  useAdminCouponCounts,
  useDeleteCoupon,
  useToggleCouponActive,
  type AdminCoupon,
  type CouponType,
  type CouponScope,
} from '@/lib/hooks/use-admin-coupons'
import { useAdminCategories } from '@/lib/hooks/use-admin-categories'
import { useAdminProducts, type AdminProduct } from '@/lib/hooks/use-admin-products'
import { errorMessage } from '@/lib/utils'

const typeTabs: { label: string; value: CouponType | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Percentage', value: 'percent' },
  { label: 'Fixed amount', value: 'fixed' },
  { label: 'Free shipping', value: 'free_shipping' },
]

const scopeTabs: { label: string; value: CouponScope | 'all' }[] = [
  { label: 'All scopes', value: 'all' },
  { label: 'Storewide', value: 'storewide' },
  { label: 'Category', value: 'category' },
  { label: 'Product', value: 'product' },
]

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatCouponValue(coupon: AdminCoupon): string {
  if (coupon.type === 'percent') return `${coupon.value}%`
  if (coupon.type === 'fixed') return `₦${coupon.value.toLocaleString()}`
  return 'Free shipping'
}

function formatScope(coupon: AdminCoupon, categoryNameById: Map<string, string>, productNameById: Map<string, string>): string {
  if (coupon.scope === 'storewide') return 'Storewide'
  if (coupon.scope === 'category' && coupon.scopeId) {
    return categoryNameById.get(coupon.scopeId) ?? `Category (${coupon.scopeId.slice(0, 8)}…)`
  }
  if (coupon.scope === 'product' && coupon.scopeId) {
    return productNameById.get(coupon.scopeId) ?? `Product (${coupon.scopeId.slice(0, 8)}…)`
  }
  return 'Storewide'
}

export default function CouponsPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<CouponType | 'all'>('all')
  const [scopeFilter, setScopeFilter] = useState<CouponScope | 'all'>('all')
  const [activeFilter, setActiveFilter] = useState<'all' | true | false>('all')
  const [deleting, setDeleting] = useState<AdminCoupon | null>(null)
  const [toggling, setToggling] = useState<AdminCoupon | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  const filters = {
    search: debouncedSearch || undefined,
    type: typeFilter === 'all' ? undefined : typeFilter,
    scope: scopeFilter === 'all' ? undefined : scopeFilter,
    active: activeFilter === 'all' ? undefined : activeFilter,
  }

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useAdminCoupons(filters)
  const { data: counts } = useAdminCouponCounts()
  const { data: categories = [] } = useAdminCategories()
  const { data: productsData } = useAdminProducts({ limit: 1000 })
  const { mutateAsync: deleteCoupon, isPending: isDeleting } = useDeleteCoupon()
  const { mutateAsync: toggleActive, isPending: isToggling } =
    useToggleCouponActive()

  const flatProducts: AdminProduct[] = useMemo(
    () => (productsData?.pages ? productsData.pages.flatMap((page) => page.data) : []),
    [productsData],
  )

  const categoryNameById = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  )
  const productNameById = useMemo(
    () => new Map(flatProducts.map((product) => [product.id, product.name])),
    [flatProducts],
  )

  const coupons = data?.pages.flatMap((page) => page.data) ?? []
  const totalCount = data?.pages[0]?.meta.total ?? 0

  const countForType = (value: CouponType | 'all') =>
    value === 'all'
      ? counts?.total
      : value === 'percent'
        ? counts?.percent
        : value === 'fixed'
          ? counts?.fixed
          : counts?.free_shipping

  const countForScope = (value: CouponScope | 'all') => {
    if (value === 'all') return counts?.total
    return counts?.[value]
  }

  const handleToggle = async () => {
    if (!toggling) return
    const nextActive = !toggling.active
    try {
      await toggleActive({ id: toggling.id, active: nextActive })
      toast.success(
        nextActive ? 'Coupon activated' : 'Coupon deactivated',
      )
      setToggling(null)
    } catch (err) {
      toast.error(errorMessage(err, 'Update failed'))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-le-jour text-3xl tracking-wide uppercase">
            Coupons
          </h1>
          <p className="text-sm text-muted-foreground">
            {totalCount} coupon{totalCount === 1 ? '' : 's'} in the system
            {debouncedSearch ? ` matching “${debouncedSearch}”` : ''}
          </p>
        </div>
        <Button asChild>
          <Link href="/coupons/new">
            <Plus className="mr-2 size-4" />
            New Coupon
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Coupon management</CardTitle>
            <CardDescription>
              Create, edit, and archive promotional codes.
            </CardDescription>
          </div>
          <Input
            placeholder="Search by code…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full sm:max-w-xs"
          />
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {typeTabs.map((item) => {
              const count = countForType(item.value)
              return (
                <Button
                  key={item.value}
                  variant={typeFilter === item.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTypeFilter(item.value)}
                >
                  {item.label}
                  {count !== undefined && (
                    <Badge variant="secondary" className="ml-2">
                      {count}
                    </Badge>
                  )}
                </Button>
              )
            })}
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {scopeTabs.map((item) => {
              const count = countForScope(item.value)
              return (
                <Button
                  key={item.value}
                  variant={scopeFilter === item.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setScopeFilter(item.value)}
                >
                  {item.label}
                  {count !== undefined && (
                    <Badge variant="secondary" className="ml-2">
                      {count}
                    </Badge>
                  )}
                </Button>
              )
            })}
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {(['all', true, false] as const).map((value) => (
              <Button
                key={String(value)}
                variant={activeFilter === value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter(value)}
              >
                {value === 'all' ? 'All' : value ? 'Active' : 'Inactive'}
              </Button>
            ))}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead className="text-right">Usage</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    Loading coupons…
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && coupons.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No coupons found.
                  </TableCell>
                </TableRow>
              )}
              {coupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell className="font-mono font-medium">
                    {coupon.code}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {coupon.type.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCouponValue(coupon)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {formatScope(coupon, categoryNameById, productNameById)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {coupon.usedCount}{coupon.maxUses ? ` / ${coupon.maxUses}` : ''}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {coupon.expiresAt
                      ? formatDate(coupon.expiresAt)
                      : 'Never'}
                  </TableCell>
                  <TableCell>
                    {coupon.active ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        aria-label={`Edit ${coupon.code}`}
                      >
                        <Link href={`/coupons/${coupon.id}/edit`}>
                          <Pencil className="size-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={
                          coupon.active ? `Deactivate ${coupon.code}` : `Activate ${coupon.code}`
                        }
                        onClick={() => setToggling(coupon)}
                        disabled={isToggling}
                      >
                        {coupon.active ? (
                          <PowerOff className="size-4 text-destructive" />
                        ) : (
                          <Power className="size-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete ${coupon.code}`}
                        onClick={() => setDeleting(coupon)}
                        disabled={isDeleting}
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

      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete coupon?</DialogTitle>
            <DialogDescription>
              This removes “{deleting?.code}” permanently. This action cannot be undone.
              Any existing usage records will also be removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isDeleting}
              onClick={async () => {
                if (!deleting) return
                try {
                  await deleteCoupon(deleting.id)
                  toast.success(`${deleting.code} deleted`)
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : 'Delete failed')
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

      <Dialog open={toggling !== null} onOpenChange={(open) => !open && setToggling(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {toggling?.active ? 'Deactivate coupon?' : 'Activate coupon?'}
            </DialogTitle>
            <DialogDescription>
              {toggling?.active
                ? `“${toggling?.code}” will no longer be valid at checkout.`
                : `“${toggling?.code}” will be available for use again.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setToggling(null)}
              disabled={isToggling}
            >
              Cancel
            </Button>
            <Button
              variant={toggling?.active ? 'destructive' : 'default'}
              disabled={isToggling}
              onClick={() => void handleToggle()}
            >
              {isToggling
                ? 'Updating…'
                : toggling?.active
                  ? 'Deactivate'
                  : 'Activate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}