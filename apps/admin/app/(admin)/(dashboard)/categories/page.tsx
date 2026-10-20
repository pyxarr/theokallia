'use client'

import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  useAdminCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useCreateSubcategory,
  useUpdateSubcategory,
  useDeleteSubcategory,
  type AdminCategory,
  type AdminSubcategory,
} from '@/lib/hooks/use-admin-categories'
import { slugifyName } from '@/lib/validations/product'
import { errorMessage } from '@/lib/utils'

type DialogState =
  | { kind: 'create-category' }
  | { kind: 'edit-category'; category: AdminCategory }
  | { kind: 'delete-category'; category: AdminCategory }
  | { kind: 'create-subcategory'; category: AdminCategory }
  | {
      kind: 'edit-subcategory'
      category: AdminCategory
      subcategory: AdminSubcategory
    }
  | {
      kind: 'delete-subcategory'
      category: AdminCategory
      subcategory: AdminSubcategory
    }
  | null

interface CategoryFormDialogProps {
  title: string
  initialName?: string
  initialSlug?: string
  isPending: boolean
  onClose: () => void
  onSubmit: (values: { name: string; slug: string }) => Promise<void>
}

/** Shared create/edit dialog for categories and subcategories. */
function CategoryFormDialog({
  title,
  initialName = '',
  initialSlug = '',
  isPending,
  onClose,
  onSubmit,
}: CategoryFormDialogProps) {
  const [name, setName] = useState(initialName)
  const [slug, setSlug] = useState(initialSlug)
  const [slugTouched, setSlugTouched] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const trimmedName = name.trim()
    const finalSlug = slug.trim()

    if (trimmedName.length < 2) {
      toast.error('Name must be at least 2 characters')
      return
    }
    if (!finalSlug) {
      toast.error('Slug is required')
      return
    }

    try {
      await onSubmit({ name: trimmedName, slug: finalSlug })
      onClose()
    } catch (err) {
      toast.error(errorMessage(err, 'Save failed'))
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            The name is shown in the shop; the slug is the URL identifier.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="category-name">Name</Label>
            <Input
              id="category-name"
              value={name}
              onChange={(event) => {
                setName(event.target.value)
                if (!slugTouched) setSlug(slugifyName(event.target.value))
              }}
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="category-slug">Slug</Label>
            <Input
              id="category-slug"
              value={slug}
              onChange={(event) => {
                setSlugTouched(true)
                setSlug(event.target.value.toLowerCase())
              }}
            />
            <p className="text-xs text-muted-foreground">
              Lowercase letters, numbers, and hyphens.
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface DeleteConfirmDialogProps {
  title: string
  description: string
  isPending: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
}

/** Confirm-before-delete dialog; surfaces server 409s as toasts. */
function DeleteConfirmDialog({
  title,
  description,
  isPending,
  onClose,
  onConfirm,
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={async () => {
              try {
                await onConfirm()
                onClose()
              } catch (err) {
                toast.error(errorMessage(err, 'Delete failed'))
              }
            }}
          >
            {isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
/** Category and subcategory management — create, rename, and delete. */
export default function CategoriesPage() {
  const { data: categories = [], isLoading } = useAdminCategories()
  const [dialog, setDialog] = useState<DialogState>(null)

  const { mutateAsync: createCategory, isPending: creatingCategory } =
    useCreateCategory()
  const { mutateAsync: updateCategory, isPending: updatingCategory } =
    useUpdateCategory()
  const { mutateAsync: deleteCategory, isPending: deletingCategory } =
    useDeleteCategory()
  const { mutateAsync: createSubcategory, isPending: creatingSubcategory } =
    useCreateSubcategory()
  const { mutateAsync: updateSubcategory, isPending: updatingSubcategory } =
    useUpdateSubcategory()
  const { mutateAsync: deleteSubcategory, isPending: deletingSubcategory } =
    useDeleteSubcategory()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-le-jour text-3xl tracking-wide uppercase">
            Categories
          </h1>
          <p className="text-sm text-muted-foreground">
            {categories.length} categor{categories.length === 1 ? 'y' : 'ies'}{' '}
            in the catalog
          </p>
        </div>
        <Button onClick={() => setDialog({ kind: 'create-category' })}>
          <Plus className="mr-2 size-4" /> New category
        </Button>
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground">Loading categories…</p>
      )}
      {!isLoading && categories.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No categories yet. Create the first one to organize your products.
          </CardContent>
        </Card>
      )}

      {categories.map((category) => (
        <Card key={category.id}>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <CardTitle>{category.name}</CardTitle>
              <Badge variant="secondary">{category.slug}</Badge>
              <CardDescription>
                {category.subcategories.length} subcategor
                {category.subcategories.length === 1 ? 'y' : 'ies'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setDialog({ kind: 'create-subcategory', category })
                }
              >
                <Plus className="mr-1 size-3" /> Subcategory
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Edit ${category.name}`}
                onClick={() => setDialog({ kind: 'edit-category', category })}
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Delete ${category.name}`}
                onClick={() => setDialog({ kind: 'delete-category', category })}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {category.subcategories.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No subcategories yet.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {category.subcategories.map((subcategory) => (
                    <TableRow key={subcategory.id}>
                      <TableCell className="font-medium">
                        {subcategory.name}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {subcategory.slug}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Edit ${subcategory.name}`}
                            onClick={() =>
                              setDialog({
                                kind: 'edit-subcategory',
                                category,
                                subcategory,
                              })
                            }
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Delete ${subcategory.name}`}
                            onClick={() =>
                              setDialog({
                                kind: 'delete-subcategory',
                                category,
                                subcategory,
                              })
                            }
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ))}

      {dialog?.kind === 'create-category' && (
        <CategoryFormDialog
          key="create-category"
          title="New category"
          isPending={creatingCategory}
          onClose={() => setDialog(null)}
          onSubmit={async (values) => {
            const created = await createCategory(values)
            toast.success(`Category "${created.name}" created`)
          }}
        />
      )}

      {dialog?.kind === 'edit-category' && (
        <CategoryFormDialog
          key={`edit-${dialog.category.slug}`}
          title={`Edit ${dialog.category.name}`}
          initialName={dialog.category.name}
          initialSlug={dialog.category.slug}
          isPending={updatingCategory}
          onClose={() => setDialog(null)}
          onSubmit={async (values) => {
            await updateCategory({ slug: dialog.category.slug, input: values })
            toast.success('Category updated')
          }}
        />
      )}

      {dialog?.kind === 'delete-category' && (
        <DeleteConfirmDialog
          title={`Delete ${dialog.category.name}?`}
          description="This also removes its subcategories. Categories with products assigned cannot be deleted."
          isPending={deletingCategory}
          onClose={() => setDialog(null)}
          onConfirm={async () => {
            await deleteCategory(dialog.category.slug)
            toast.success(`Category "${dialog.category.name}" deleted`)
          }}
        />
      )}

      {dialog?.kind === 'create-subcategory' && (
        <CategoryFormDialog
          key={`create-sub-${dialog.category.slug}`}
          title={`New subcategory under ${dialog.category.name}`}
          isPending={creatingSubcategory}
          onClose={() => setDialog(null)}
          onSubmit={async (values) => {
            const created = await createSubcategory({
              categorySlug: dialog.category.slug,
              ...values,
            })
            toast.success(`Subcategory "${created.name}" created`)
          }}
        />
      )}

      {dialog?.kind === 'edit-subcategory' && (
        <CategoryFormDialog
          key={`edit-sub-${dialog.subcategory.slug}`}
          title={`Edit ${dialog.subcategory.name}`}
          initialName={dialog.subcategory.name}
          initialSlug={dialog.subcategory.slug}
          isPending={updatingSubcategory}
          onClose={() => setDialog(null)}
          onSubmit={async (values) => {
            await updateSubcategory({
              categorySlug: dialog.category.slug,
              subSlug: dialog.subcategory.slug,
              input: values,
            })
            toast.success('Subcategory updated')
          }}
        />
      )}

      {dialog?.kind === 'delete-subcategory' && (
        <DeleteConfirmDialog
          title={`Delete ${dialog.subcategory.name}?`}
          description={`Removes it from ${dialog.category.name}. Subcategories with products assigned cannot be deleted.`}
          isPending={deletingSubcategory}
          onClose={() => setDialog(null)}
          onConfirm={async () => {
            await deleteSubcategory({
              categorySlug: dialog.category.slug,
              subSlug: dialog.subcategory.slug,
            })
            toast.success(`Subcategory "${dialog.subcategory.name}" deleted`)
          }}
        />
      )}
    </div>
  )
}
