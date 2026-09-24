'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  useCreateCategory,
  useCreateSubcategory,
} from '@/lib/hooks/use-admin-categories'
import { slugifyName } from '@/lib/validations/product'

interface CategoryCreatorProps {
  /** Slug of the category currently selected in the form — required for subcategories. */
  selectedCategorySlug: string
  onCategoryCreated: (slug: string) => void
  onSubcategoryCreated: (slug: string) => void
}

/**
 * Inline category and subcategory creation for the product form — posts to the
 * admin-guarded /categories endpoints and reports the new slugs back so the
 * form can preselect them.
 */
export default function CategoryCreator({
  selectedCategorySlug,
  onCategoryCreated,
  onSubcategoryCreated,
}: CategoryCreatorProps) {
  const { mutateAsync: createCategory, isPending: isCreatingCategory } =
    useCreateCategory()
  const { mutateAsync: createSubcategory, isPending: isCreatingSubcategory } =
    useCreateSubcategory()

  const [adding, setAdding] = useState<'category' | 'subcategory' | null>(null)
  const [name, setName] = useState('')

  const slug = slugifyName(name)

  const reset = () => {
    setAdding(null)
    setName('')
  }

  const handleCreate = async () => {
    const trimmed = name.trim()
    if (!slug || trimmed.length < 2) {
      toast.error('Name must be at least 2 characters')
      return
    }

    try {
      if (adding === 'category') {
        const created = await createCategory({ name: trimmed, slug })
        toast.success(`Category "${created.name}" created`)
        onCategoryCreated(created.slug)
      } else if (adding === 'subcategory') {
        const created = await createSubcategory({
          categorySlug: selectedCategorySlug,
          name: trimmed,
          slug,
        })
        toast.success(`Subcategory "${created.name}" created`)
        onSubcategoryCreated(created.slug)
      }
      reset()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Create failed')
    }
  }

  if (adding === null) {
    return (
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setAdding('category')}
        >
          <Plus className="mr-1 size-3" /> New category
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!selectedCategorySlug}
          onClick={() => setAdding('subcategory')}
        >
          <Plus className="mr-1 size-3" /> New subcategory
        </Button>
      </div>
    )
  }

  const label = adding === 'category' ? 'Category' : 'Subcategory'

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="new-category-name">New {label.toLowerCase()} name</Label>
      <div className="flex gap-2">
        <Input
          id="new-category-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={`e.g. ${adding === 'category' ? 'Necklaces' : 'Gold Chains'}`}
          autoFocus
        />
        <Button
          type="button"
          size="sm"
          disabled={isCreatingCategory || isCreatingSubcategory}
          onClick={() => void handleCreate()}
        >
          {isCreatingCategory || isCreatingSubcategory ? 'Creating…' : 'Create'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Cancel"
          onClick={reset}
        >
          <X className="size-4" />
        </Button>
      </div>
      {slug && <p className="text-xs text-muted-foreground">Slug: {slug}</p>}
      {adding === 'subcategory' && !selectedCategorySlug && (
        <p className="text-xs text-destructive">Pick a category first.</p>
      )}
    </div>
  )
}
