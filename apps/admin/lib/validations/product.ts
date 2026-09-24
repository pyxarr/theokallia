import * as z from 'zod'

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Shared product fields for create and edit — mirrors CreateProductDto server-side. */
export const productFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .regex(slugPattern, 'Slug must be lowercase letters, numbers, and hyphens only'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().min(0, 'Price must be 0 or more'),
  usdPrice: z.number().min(0, 'USD price must be 0 or more').optional(),
  gbpPrice: z.number().min(0, 'GBP price must be 0 or more').optional(),
  stock: z.number().int().min(0, 'Stock must be 0 or more'),
  inStock: z.boolean(),
  categorySlug: z.string().min(1, 'Category is required'),
  subcategorySlug: z.string().optional(),
})

export type ProductFormValues = z.infer<typeof productFormSchema>

/** Generates a URL-safe slug from a product name. */
export function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}
