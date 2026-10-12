'use client'

import { useParams } from 'next/navigation'
import CouponForm from '@/components/coupons/coupon-form'

export default function EditCouponPage() {
  const params = useParams<{ id: string }>()
  const id = typeof params.id === 'string' ? params.id : undefined

  return <CouponForm id={id} />
}
