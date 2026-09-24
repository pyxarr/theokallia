'use client'

import { CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function SuccessPage() {
  return (
    <div className="min-h-screen w-full bg-white px-20 pt-10 flex flex-col items-center justify-center text-center">
      <div className="flex flex-col items-center gap-4">
        <CheckCircle size={64} className="text-green-500" />
        <h1 className="font-le-jour text-6xl tracking-wide uppercase">
          Thank You
        </h1>
        <p className="text-xl text-gray-600 max-w-md">
          Your payment was successful. Your order is now being processed and will be shipped soon.
        </p>
        <div className="mt-8 flex gap-4">
          <Link href="/profile/orders">
            <Button className="bg-black text-white px-8 py-3 text-sm tracking-widest uppercase hover:bg-gray-800">
              View My Orders
            </Button>
          </Link>
          <Link href="/shop">
            <Button variant="outline" className="px-8 py-3 text-sm tracking-widest uppercase">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
