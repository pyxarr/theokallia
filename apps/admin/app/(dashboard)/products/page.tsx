'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card,
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
  useAdminProducts,
  useDeleteProduct,
  type AdminProduct,
} from '@/lib/hooks/use-admin-products'

export default function ProductsPage() {
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState<AdminProduct | null>(null)
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useAdminProducts()
  const { mutateAsync: deleteProduct, isPending: isDeleting } = useDeleteProduct()

  // client-side name filter over loaded pages — the API has no search param yet
  const products = (data?.pages.flatMap((page) => page.data) ?? []).filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase()),
  )
  const totalCount = data?.pages[0]?.meta.total ?? 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-le-jour text-3xl tracking-wide uppercase">Products</h1>
          <p className="text-sm text-muted-foreground">
            {totalCount} product{totalCount === 1 ? '' : 's'} in the catalog
          </p>
        </div>
        <Button asChild>
          <Link href="/products/new">
            <Plus className="mr-2 size-4" />
            New Product
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Catalog</CardTitle>
            <CardDescription>Manage pricing, inventory, and media.</CardDescription>
          </div>
          <Input
            placeholder="Filter by name…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full sm:max-w-xs"
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Loading products…
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && products.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No products found.
                  </TableCell>
                </TableRow>
              )}
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="relative size-10 shrink-0 overflow-hidden bg-muted">
                        {product.assets[0]?.publicId && (
                          <Image
                            src={product.assets[0].publicId}
                            alt={product.name}
                            fill
                            sizes='40px'
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{product.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{product.slug}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {product.subcategory?.name ?? product.category.name}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ₦{product.price.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.inStock ? 'default' : 'secondary'}>
                      {product.inStock ? `In stock (${product.stock})` : 'Out of stock'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button asChild variant="ghost" size="icon">
                        <Link
                          href={`/products/${product.slug}/edit`}
                          aria-label={`Edit ${product.name}`}
                        >
                          <Pencil className="size-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete ${product.name}`}
                        onClick={() => setDeleting(product)}
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
            <DialogTitle>Delete product?</DialogTitle>
            <DialogDescription>
              This removes “{deleting?.name}” from the catalog. This action cannot be undone.
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
                  await deleteProduct(deleting.slug)
                  toast.success(`${deleting.name} deleted`)
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
    </div>
  )
}
