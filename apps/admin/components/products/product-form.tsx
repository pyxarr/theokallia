'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { Textarea } from '@/components/ui/textarea'
import MediaManager, {
  type PendingMedia,
} from '@/components/products/media-manager'
import CategoryCreator from '@/components/products/category-creator'
import { useAdminCategories } from '@/lib/hooks/use-admin-categories'
import {
  useAdminProduct,
  useCreateProduct,
  useUpdateProduct,
} from '@/lib/hooks/use-admin-products'
import {
  productFormSchema,
  slugifyName,
  type ProductFormValues,
} from '@/lib/validations/product'

interface ProductFormProps {
  /** Present in edit mode; absent on the create form. */
  slug?: string
}

/**
 * Product create/edit form shared by /products/new and /products/[slug]/edit.
 * In edit mode the form prefills from GET /products/:slug and links media
 * immediately; on create, media stays pending until the product exists.
 */
export default function ProductForm({ slug }: ProductFormProps) {
  const router = useRouter()
  const isEdit = !!slug

  const { data: product, isLoading } = useAdminProduct(slug)
  const { data: categories = [] } = useAdminCategories()
  const { mutateAsync: createProduct, isPending: isCreating } =
    useCreateProduct()
  const { mutateAsync: updateProduct, isPending: isUpdating } =
    useUpdateProduct()

  const [pending, setPending] = useState<PendingMedia[]>([])
  const [assets, setAssets] = useState(product?.assets ?? [])
  const [slugTouched, setSlugTouched] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      price: 0,
      stock: 0,
      inStock: true,
      categorySlug: '',
      subcategorySlug: '',
    },
  })

  useEffect(() => {
    if (!product || categories.length === 0) return
    reset({
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      usdPrice: product.usdPrice ?? undefined,
      gbpPrice: product.gbpPrice ?? undefined,
      stock: product.stock,
      inStock: product.inStock,
      categorySlug:
        categories.find((category) => category.id === product.categoryId)
          ?.slug ?? '',
      subcategorySlug:
        categories
          .flatMap((category) => category.subcategories)
          .find((subcategory) => subcategory.id === product.subcategoryId)
          ?.slug ?? '',
    })
    setAssets(product.assets)
  }, [product, categories, reset])

  const name = watch('name')
  const categorySlug = watch('categorySlug')
  const subcategories =
    categories.find((category) => category.slug === categorySlug)
      ?.subcategories ?? []

  const onSubmit = async (values: ProductFormValues) => {
    try {
      if (isEdit && slug) {
        await updateProduct({ slug, input: values })
        toast.success('Product updated')
        router.push('/products')
        return
      }

      const created = await createProduct({
        ...values,
        images: pending.map((item) => item.publicId),
      })
      toast.success('Product created')
      router.push(`/products/${created.slug}/edit`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Request failed')
    }
  }

  if (isEdit && isLoading) {
    return <p className="text-sm text-muted-foreground">Loading product…</p>
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-le-jour text-3xl tracking-wide uppercase">
            {isEdit ? 'Edit product' : 'New product'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEdit
              ? 'Update pricing, inventory, description, and media.'
              : 'Create a catalog product with media.'}
          </p>
        </div>
        {isEdit && product && (
          <Badge variant={product.inStock ? 'default' : 'secondary'}>
            {product.inStock ? 'In stock' : 'Out of stock'}
          </Badge>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
            <CardDescription>
              Name, slug, and description shown on the storefront.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                {...register('name')}
                onChange={(event) => {
                  if (!slugTouched) {
                    setValue('slug', slugifyName(event.target.value), {
                      shouldValidate: true,
                    })
                  }
                }}
              />
              {errors.name && (
                <p className="text-xs text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                {...register('slug', { onChange: () => setSlugTouched(true) })}
                placeholder={slugifyName(name || 'product-name')}
              />
              {errors.slug && (
                <p className="text-xs text-destructive">
                  {errors.slug.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={5}
                {...register('description')}
              />
              {errors.description && (
                <p className="text-xs text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Pricing & inventory</CardTitle>
              <CardDescription>
                NGN price is required; USD and GBP overrides are optional.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="price">Price (₦)</Label>
                  <Input
                    id="price"
                    type="number"
                    min={0}
                    step="any"
                    {...register('price', { valueAsNumber: true })}
                  />
                  {errors.price && (
                    <p className="text-xs text-destructive">
                      {errors.price.message}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="usdPrice">USD ($)</Label>
                  <Input
                    id="usdPrice"
                    type="number"
                    min={0}
                    step="any"
                    {...register('usdPrice', { valueAsNumber: true })}
                  />
                  {errors.usdPrice && (
                    <p className="text-xs text-destructive">
                      {errors.usdPrice.message}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="gbpPrice">GBP (£)</Label>
                  <Input
                    id="gbpPrice"
                    type="number"
                    min={0}
                    step="any"
                    {...register('gbpPrice', { valueAsNumber: true })}
                  />
                  {errors.gbpPrice && (
                    <p className="text-xs text-destructive">
                      {errors.gbpPrice.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="stock">Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    min={0}
                    step={1}
                    {...register('stock', { valueAsNumber: true })}
                  />
                  {errors.stock && (
                    <p className="text-xs text-destructive">
                      {errors.stock.message}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="inStock">Availability</Label>
                  <Select
                    value={String(watch('inStock'))}
                    onValueChange={(value) =>
                      setValue('inStock', value === 'true')
                    }
                  >
                    <SelectTrigger id="inStock">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">In stock</SelectItem>
                      <SelectItem value="false">Out of stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
              <CardDescription>
                Subcategory options follow the chosen category.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="categorySlug">Category</Label>
                <Select
                  value={categorySlug || ''}
                  onValueChange={(value) => {
                    setValue('categorySlug', value, { shouldValidate: true })
                    setValue('subcategorySlug', '')
                  }}
                >
                  <SelectTrigger id="categorySlug">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.slug}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.categorySlug && (
                  <p className="text-xs text-destructive">
                    {errors.categorySlug.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="subcategorySlug">Subcategory (optional)</Label>
                <Select
                  value={watch('subcategorySlug') || ''}
                  onValueChange={(value) => setValue('subcategorySlug', value)}
                  disabled={subcategories.length === 0}
                >
                  <SelectTrigger id="subcategorySlug">
                    <SelectValue placeholder="Select a subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    {subcategories.map((subcategory) => (
                      <SelectItem key={subcategory.id} value={subcategory.slug}>
                        {subcategory.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <CategoryCreator
                selectedCategorySlug={categorySlug || ''}
                onCategoryCreated={(slug) => {
                  setValue('categorySlug', slug, { shouldValidate: true })
                  setValue('subcategorySlug', '')
                }}
                onSubcategoryCreated={(slug) =>
                  setValue('subcategorySlug', slug)
                }
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Media</CardTitle>
          <CardDescription>
            {isEdit
              ? 'New files upload immediately; removed images are deleted from Cloudinary.'
              : 'Files stay pending until the product is created.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MediaManager
            assets={assets}
            pending={pending}
            productId={isEdit && product ? product.id : null}
            altTextPrefix={name || product?.name || 'Product'}
            onPendingChange={setPending}
            onAssetRemoved={(assetId) =>
              setAssets((current) =>
                current.filter((asset) => asset.id !== assetId)
              )
            }
            onError={(message) => toast.error(message)}
          />
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isCreating || isUpdating}>
          {isCreating || isUpdating
            ? 'Saving…'
            : isEdit
              ? 'Save changes'
              : 'Create product'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/products')}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
