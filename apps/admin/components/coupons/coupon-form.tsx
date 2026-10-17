'use client'

import { useEffect } from 'react'
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
import { useAdminCategories } from '@/lib/hooks/use-admin-categories'
import {
  useAdminProducts,
  type AdminProduct,
} from '@/lib/hooks/use-admin-products'
import {
  useAdminCoupon,
  useCreateCoupon,
  useUpdateCoupon,
} from '@/lib/hooks/use-admin-coupons'
import {
  couponFormSchema,
  numberInput,
  type CouponFormValues,
} from '@/lib/validations/coupon'

/** Select options — Base UI renders `label` in the trigger, not the raw value. */
const discountTypeItems = [
  { value: 'percent', label: 'Percentage off' },
  { value: 'fixed', label: 'Fixed amount (₦)' },
  { value: 'free_shipping', label: 'Free shipping' },
]

const scopeItems = [
  { value: 'storewide', label: 'Storewide' },
  { value: 'category', label: 'Category' },
  { value: 'product', label: 'Product' },
]

const availabilityItems = [
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
]

/**
 * Converts a stored ISO timestamp into the `YYYY-MM-DDTHH:mm` shape a
 * `<input type="datetime-local">` requires. Returns undefined when there is no
 * expiry, since a full ISO string would leave the input blank.
 */
function toDatetimeLocal(iso: string | null): string | undefined {
  if (!iso) return undefined
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return undefined

  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

interface CouponFormProps {
  /** Present in edit mode; absent on the create form. */
  id?: string
}

/**
 * Coupon create/edit form shared by /coupons/new and /coupons/[id]/edit.
 * In edit mode the form prefills from GET /coupons/:id.
 */
export default function CouponForm({ id }: CouponFormProps) {
  const router = useRouter()
  const isEdit = !!id

  const { data: coupon, isLoading } = useAdminCoupon(id)
  const { data: categories = [] } = useAdminCategories()
  const { data: productsData } = useAdminProducts({ limit: 1000 })
  const { mutateAsync: createCoupon, isPending: isCreating } =
    useCreateCoupon()
  const { mutateAsync: updateCoupon, isPending: isUpdating } =
    useUpdateCoupon()

  // Flatten infinite query pages into a single array
  const flatProducts: AdminProduct[] = productsData?.pages
    ? productsData.pages.flatMap((page) => page.data)
    : []

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CouponFormValues>({
    resolver: zodResolver(couponFormSchema),
    defaultValues: {
      code: '',
      type: 'percent',
      value: 0,
      scope: 'storewide',
      scopeId: undefined,
      minOrder: undefined,
      maxUses: undefined,
      perUserLimit: undefined,
      expiresAt: undefined,
      active: true,
    },
  })

  useEffect(() => {
    if (!coupon) return
    reset({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      scope: coupon.scope,
      scopeId: coupon.scopeId ?? undefined,
      minOrder: coupon.minOrder ?? undefined,
      maxUses: coupon.maxUses ?? undefined,
      perUserLimit: coupon.perUserLimit ?? undefined,
      expiresAt: toDatetimeLocal(coupon.expiresAt),
      active: coupon.active,
    })
  }, [coupon, reset])

  const type = watch('type')
  const scope = watch('scope')
  const scopeId = watch('scopeId')

  const categoryOptions =
    scope === 'category'
      ? categories
      : scope === 'product'
        ? flatProducts
        : []

  const scopeIdItems = categoryOptions.map((item) => ({
    value: item.id,
    label: item.name,
  }))

  const isScoped = scope === 'category' || scope === 'product'

  const onSubmit = async (values: CouponFormValues) => {
    try {
      const payload = {
        ...values,
        // free_shipping ignores the amount — send 0 so the API stores a clean value
        value: values.type === 'free_shipping' ? 0 : values.value,
        maxUses: values.maxUses ?? null,
        perUserLimit: values.perUserLimit ?? null,
        minOrder: values.minOrder ?? null,
        // datetime-local gives local time; the API expects a full ISO timestamp
        expiresAt: values.expiresAt
          ? new Date(values.expiresAt).toISOString()
          : null,
        scopeId: values.scopeId || null,
      }

      if (isEdit && id) {
        await updateCoupon({ id, input: payload })
        toast.success('Coupon updated')
        router.push('/coupons')
        return
      }

      await createCoupon(payload)
      toast.success('Coupon created')
      router.push('/coupons')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Request failed')
    }
  }

  if (isEdit && isLoading) {
    return <p className="text-sm text-muted-foreground">Loading coupon…</p>
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-le-jour text-3xl tracking-wide uppercase">
            {isEdit ? 'Edit coupon' : 'New coupon'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEdit
              ? 'Update discount rules, limits, and availability.'
              : 'Create a promotional coupon for checkout.'}
          </p>
        </div>
        {isEdit && coupon && (
          <Badge variant={coupon.active ? 'default' : 'secondary'}>
            {coupon.active ? 'Active' : 'Inactive'}
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>
            Coupon code, discount type, and value.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="code">Code</Label>
            <Input
              id="code"
              {...register('code')}
              placeholder="WELCOME10"
              maxLength={50}
            />
            {errors.code && (
              <p className="text-xs text-destructive">{errors.code.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="type">Discount type</Label>
              <Select
                items={discountTypeItems}
                value={type}
                onValueChange={(value) => {
                  const nextType = value as CouponFormValues['type']
                  setValue('type', nextType)
                  // free_shipping ignores the amount — reset it so a value typed
                  // for another type can never block submission here
                  if (nextType === 'free_shipping') setValue('value', 0)
                }}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {discountTypeItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="value">
                Value
                {type === 'percent' && ' (%)'}
                {type === 'fixed' && ' (₦)'}
                {type === 'free_shipping' && ' (ignored)'}
              </Label>
              <Input
                id="value"
                type="number"
                min={0}
                step="any"
                disabled={type === 'free_shipping'}
                {...register('value', {
                  setValueAs: (raw) => numberInput(raw) ?? 0,
                })}
              />
              {errors.value && (
                <p className="text-xs text-destructive">{errors.value.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="scope">Scope</Label>
              <Select
                items={scopeItems}
                value={scope}
                onValueChange={(value) => {
                  if (value == null) return
                  setValue('scope', value as CouponFormValues['scope'])
                  setValue('scopeId', undefined)
                }}
              >
                <SelectTrigger id="scope">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {scopeItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isScoped && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="scopeId">
                {scope === 'category' ? 'Category' : 'Product'}
              </Label>
              <Select
                key={scope}
                items={scopeIdItems}
                value={scopeId ?? ''}
                onValueChange={(value) => setValue('scopeId', value || undefined)}
                disabled={categoryOptions.length === 0}
              >
                <SelectTrigger id="scopeId">
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {scopeIdItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.scopeId && (
                <p className="text-xs text-destructive">
                  {errors.scopeId.message}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Limits & scheduling</CardTitle>
          <CardDescription>
            Control how and when the coupon can be used.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="minOrder">Minimum order (₦)</Label>
              <Input
                id="minOrder"
                type="number"
                min={0}
                step="any"
                placeholder="No minimum"
                {...register('minOrder', { setValueAs: numberInput })}
              />
              {errors.minOrder && (
                <p className="text-xs text-destructive">
                  {errors.minOrder.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="maxUses">Max total uses</Label>
              <Input
                id="maxUses"
                type="number"
                min={1}
                step={1}
                placeholder="Unlimited"
                {...register('maxUses', { setValueAs: numberInput })}
              />
              {errors.maxUses && (
                <p className="text-xs text-destructive">
                  {errors.maxUses.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="perUserLimit">Max uses per user</Label>
              <Input
                id="perUserLimit"
                type="number"
                min={1}
                step={1}
                placeholder="Unlimited"
                {...register('perUserLimit', { setValueAs: numberInput })}
              />
              {errors.perUserLimit && (
                <p className="text-xs text-destructive">
                  {errors.perUserLimit.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="expiresAt">Expires at</Label>
                {watch('expiresAt') && (
                  <button
                    type="button"
                    className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                    onClick={() => setValue('expiresAt', undefined)}
                  >
                    Clear
                  </button>
                )}
              </div>
              <Input
                id="expiresAt"
                type="datetime-local"
                step={60}
                {...register('expiresAt')}
              />
              <p className="text-xs text-muted-foreground">
                Leave blank for a coupon that never expires.
              </p>
              {errors.expiresAt && (
                <p className="text-xs text-destructive">
                  {errors.expiresAt.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="active">Availability</Label>
            <Select
              items={availabilityItems}
              value={String(watch('active'))}
              onValueChange={(value) =>
                setValue('active', value === 'true')
              }
            >
              <SelectTrigger id="active">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availabilityItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isCreating || isUpdating}>
          {isCreating || isUpdating
            ? 'Saving…'
            : isEdit
              ? 'Save changes'
              : 'Create coupon'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/coupons')}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}