'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useInitializePayment, useVerifyPayment } from '@/lib/hooks/use-payments'
import { useCreateOrder } from '@/lib/hooks/use-orders'
import { useValidateCoupon } from '@/lib/hooks/use-coupons'
import { useCart } from '@/lib/hooks/use-cart'
import { useAuthStore } from '@/lib/stores/auth-store'
import { useCurrency } from '@/lib/hooks/use-currency'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

// Dynamically import the hook-related logic or the library if it's causing issues.
// However, react-paystack is a hook. Hooks must be used inside components.
// The issue is the library itself likely accesses `window` at the top level.


const checkoutSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  street: z.string().min(5, 'Shipping address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  country: z.string().min(2, 'Country is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
})

type CheckoutFormValues = z.infer<typeof checkoutSchema>

interface CheckoutFormProps {
  onPaymentInitiated: (details: CheckoutFormValues) => void
  isPending: boolean
  onCouponApplied: (discount: number, code: string) => void
  onCouponCleared: () => void
}

export default function CheckoutForm({ onPaymentInitiated, isPending, onCouponApplied, onCouponCleared }: CheckoutFormProps) {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const { mutateAsync: initializePayment, isPending: isInitializing } = useInitializePayment()
  const { mutateAsync: createOrder, isPending: isCreatingOrder } = useCreateOrder()
  const { mutateAsync: verifyPayment } = useVerifyPayment()
  const { validate, clear, isValidating, error: couponError, result: couponResult } = useValidateCoupon()
  const { data: dbCart, isLoading: cartLoading } = useCart(isAuthenticated)
  const [couponInput, setCouponInput] = useState('')
  const [appliedDiscount, setAppliedDiscount] = useState(0)
  const [appliedCouponCode, setAppliedCouponCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const { formatPrice } = useCurrency()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      country: 'Nigeria',
    },
  })


  // Prevent navigation during payment verification
  useEffect(() => {
    if (!isVerifying) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }

    const handlePopState = () => {
      // Push the current state back to prevent back/forward
      window.history.pushState(null, '', window.location.href)
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('popstate', handlePopState)
    // Push initial state so popstate fires on first back attempt
    window.history.pushState(null, '', window.location.href)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [isVerifying])

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return
    if (!dbCart?.items?.length) return

    const subtotal = dbCart.items.reduce(
      (sum: number, item: any) => sum + (item.product.price ?? 0) * item.quantity,
      0,
    )

    const items = dbCart.items.map((item: any) => ({
      productId: item.product.id,
      categoryId: item.product.categoryId,
      price: item.product.price ?? 0,
      quantity: item.quantity,
    }))

    await validate(couponInput, subtotal, items)
  }

  const onSubmit = async (data: CheckoutFormValues) => {
    try {
      onPaymentInitiated(data)
      
      // 2. Create the order first
      const order = await createOrder({
        shippingAddress: {
          street: data.street,
          city: data.city,
          state: data.state,
          country: data.country,
        },
        couponCode: couponResult?.code ?? undefined,
      })
      
      // 3. Initialize payment using the created order's ID
      const paymentData = await initializePayment(order.id)
      
      // 4. Trigger Paystack popup
      // Since react-paystack has SSR issues, we use the native window call 
      // but wrapped in a check to ensure it only runs on the client.
      if (typeof window !== 'undefined') {
        if (!window.PaystackPop) {
          await new Promise((resolve) => {
            const script = document.createElement('script')
            script.src = 'https://js.paystack.co/v1/inline.js'
            script.async = true
            script.onload = resolve
            document.head.appendChild(script)
          })
        }

        // Ensure the script has initialized the global object
        await new Promise((resolve) => setTimeout(resolve, 100))

        if (window.PaystackPop && typeof window.PaystackPop.setup === 'function') {
          const handler = window.PaystackPop.setup({
            key: paymentData.publicKey,
            email: paymentData.email,
            amount: paymentData.amount,
            currency: 'NGN',
            ref: paymentData.reference,
            callback: (response: { reference: string }) => {
              setIsVerifying(true)
              verifyPayment(response.reference).then(() => {
                toast.success('Payment successful! Redirecting...')
                router.push('/checkout/success')
              }).catch(() => {
                setIsVerifying(false)
                toast.error('Payment verification failed. Please contact support.')
                router.push('/checkout/cancel')
              })
            },
            onClose: () => {
              toast.error('Payment cancelled.')
              router.push('/checkout/cancel')
            },
          })
          handler.openIframe()
        } else {
          throw new Error('PaystackPop.setup is not available')
        }
      }
    } catch (unknownError) {
      const error = unknownError as { response?: { data?: { message?: string } } }
      toast.error(error?.response?.data?.message || 'Failed to complete purchase. Please try again.')
      console.error(unknownError)
      console.error(error)
    }
  }

  // Update applied discount and code when validation result changes
  useEffect(() => {
    if (couponResult) {
      setAppliedDiscount(couponResult.discount)
      setAppliedCouponCode(couponResult.code)
      onCouponApplied(couponResult.discount, couponResult.code)
    } else {
      onCouponCleared()
    }
  }, [couponResult, onCouponApplied, onCouponCleared])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <h2 className="font-le-jour text-2xl tracking-wide uppercase">
        Shipping Details
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <input
            {...register('fullName')}
            placeholder="Full Name"
            disabled={isInitializing || isCreatingOrder}
            className="w-full border border-gray-200 p-3 text-sm outline-none focus:border-black disabled:cursor-not-allowed disabled:opacity-50"
          />
          {errors.fullName && <span className="text-xs text-red-500">{errors.fullName.message}</span>}
        </div>

        <div className="flex flex-col gap-1">
          <input
            {...register('phone')}
            placeholder="Phone Number"
            disabled={isInitializing || isCreatingOrder}
            className="w-full border border-gray-200 p-3 text-sm outline-none focus:border-black disabled:cursor-not-allowed disabled:opacity-50"
          />
          {errors.phone && <span className="text-xs text-red-500">{errors.phone.message}</span>}
        </div>

        <div className="flex flex-col gap-1">
          <input
            {...register('street')}
            placeholder="Street Address"
            disabled={isInitializing || isCreatingOrder}
            className="w-full border border-gray-200 p-3 text-sm outline-none focus:border-black disabled:cursor-not-allowed disabled:opacity-50"
          />
          {errors.street && <span className="text-xs text-red-500">{errors.street.message}</span>}
        </div>

        <div className="flex flex-col gap-1 md:col-span-2">
          <input
            {...register('city')}
            placeholder="City"
            disabled={isInitializing || isCreatingOrder}
            className="w-full border border-gray-200 p-3 text-sm outline-none focus:border-black disabled:cursor-not-allowed disabled:opacity-50"
          />
          {errors.city && <span className="text-xs text-red-500">{errors.city.message}</span>}
        </div>

        <div className="flex flex-col gap-1">
          <input
            {...register('state')}
            placeholder="State"
            disabled={isInitializing || isCreatingOrder}
            className="w-full border border-gray-200 p-3 text-sm outline-none focus:border-black disabled:cursor-not-allowed disabled:opacity-50"
          />
          {errors.state && <span className="text-xs text-red-500">{errors.state.message}</span>}
        </div>

        <div className="flex flex-col gap-1">
          <input
            {...register('country')}
            placeholder="Country"
            disabled={isInitializing || isCreatingOrder}
            className="w-full border border-gray-200 p-3 text-sm outline-none focus:border-black disabled:cursor-not-allowed disabled:opacity-50"
          />
          {errors.country && <span className="text-xs text-red-500">{errors.country.message}</span>}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={couponInput}
            onChange={(e) => {
              setCouponInput(e.target.value)
              if (couponResult) clear()
            }}
            placeholder="Coupon code"
            className="flex-1 border border-gray-200 p-3 text-sm outline-none focus:border-black uppercase"
          />
          <button
            type="button"
            onClick={handleApplyCoupon}
            disabled={isValidating || !couponInput.trim() || cartLoading}
            className="border border-black px-4 text-sm tracking-widest uppercase hover:bg-black hover:text-white transition-colors disabled:opacity-50"
          >
            {isValidating ? '...' : 'Apply'}
          </button>
        </div>
        {couponError && <p className="text-xs text-red-500">{couponError}</p>}
        {couponResult && (
          <p className="text-xs text-green-600">
            Coupon applied — {formatPrice(couponResult.discount)} off
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isInitializing || isCreatingOrder || isPending}
        className="w-full py-4 text-sm tracking-widest text-white uppercase transition-colors hover:bg-purple-700 disabled:opacity-50"
        style={{ background: 'var(--color-primary)' }}
      >
        {isInitializing || isCreatingOrder ? 'Processing...' : 'Complete Purchase'}
      </button>

      {isVerifying && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="flex flex-col items-center gap-4 rounded-lg bg-white px-12 py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-black" />
            <p className="font-allure text-xl text-gray-900">Processing your payment...</p>
            <p className="text-sm text-gray-500">Please do not close this page.</p>
          </div>
        </div>
      )}
    </form>
  )
}