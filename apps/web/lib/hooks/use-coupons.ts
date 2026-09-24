import { useState } from 'react'
import api from '@/lib/api'
import axios from 'axios'

export interface CouponValidationResult {
  valid: boolean
  discount: number
  type: string
  code: string
  couponId: string
}

/**
 * Hook for pre-flight coupon validation at checkout.
 * Calls POST /coupons/validate with the current cart contents and coupon code.
 * Returns the validated discount amount and coupon details on success.
 */
export function useValidateCoupon() {
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CouponValidationResult | null>(null)

  const validate = async (
    code: string,
    subtotal: number,
    items: Array<{ productId: string; categoryId: string; price: number; quantity: number }>,
  ) => {
    setIsValidating(true)
    setError(null)
    setResult(null)

    try {
      const response = await api.post<CouponValidationResult>('/coupons/validate', {
        code: code.trim().toUpperCase(),
        subtotal,
        items,
      })
      setResult(response.data)
      return response.data
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message ?? 'Invalid coupon code.'
        : 'Invalid coupon code.'
      setError(message)
      return null
    } finally {
      setIsValidating(false)
    }
  }

  const clear = () => {
    setResult(null)
    setError(null)
  }

  return { validate, clear, isValidating, error, result }
}