import * as z from 'zod'

/**
 * Coerces a raw `<input type="number">` value into a number, treating a blank
 * field as "not provided". React Hook Form applies this via `setValueAs` before
 * validation, which keeps the schema's input and output types identical so it
 * stays compatible with `useForm` + `zodResolver`.
 */
export const numberInput = (value: unknown): number | undefined => {
  if (value === '' || value === null || value === undefined) return undefined
  if (typeof value === 'number') return Number.isNaN(value) ? undefined : value
  const trimmed = String(value).trim()
  if (trimmed === '') return undefined
  const parsed = Number(trimmed)
  return Number.isNaN(parsed) ? undefined : parsed
}

/** Required amount (₦ or %) — the form supplies 0 when the field is cleared. */
const amountOrDefault = z.number().min(0, 'Value must be 0 or more')

/** Optional amount (₦) — blank means "no minimum order". */
const optionalAmount = z
  .number()
  .min(0, 'Minimum order must be 0 or more')
  .optional()

/** Optional whole number ≥ 1 — blank means "unlimited". */
const optionalPositiveInt = z
  .number()
  .int()
  .min(1, 'Must be at least 1')
  .optional()

/**
 * Accepts a `datetime-local` value (YYYY-MM-DDTHH:mm) or a full ISO string.
 * Blank means "never expires". Deliberately not transformed to ISO here so the
 * datetime-local input can round-trip the value it rendered; the form converts
 * to ISO on submit.
 */
const optionalExpiry = z
  .string()
  .optional()
  .refine((value) => !value || !Number.isNaN(new Date(value).getTime()), {
    message: 'Enter a valid date and time',
  })

/** Shared coupon fields for create and edit — mirrors CreateCouponDto server-side. */
export const couponFormSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(1, 'Code is required')
      .max(50, 'Code must be 50 characters or fewer')
      .transform((val) => val.toUpperCase()),
    type: z.enum(['percent', 'fixed', 'free_shipping']),
    value: amountOrDefault,
    scope: z.enum(['storewide', 'category', 'product']),
    scopeId: z.string().optional(),
    minOrder: optionalAmount,
    maxUses: optionalPositiveInt,
    perUserLimit: optionalPositiveInt,
    expiresAt: optionalExpiry,
    active: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if ((data.scope === 'category' || data.scope === 'product') && !data.scopeId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['scopeId'],
        message: 'Category or product is required for scoped coupons',
      })
    }
    if (data.type === 'percent' && data.value > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['value'],
        message: 'Percentage cannot exceed 100%',
      })
    }
  })

export type CouponFormValues = z.infer<typeof couponFormSchema>