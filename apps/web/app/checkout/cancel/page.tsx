'use client'

import { XCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function CancelPage() {
  return (
    <div className="min-h-screen w-full bg-white px-20 pt-10 flex flex-col items-center justify-center text-center">
      <div className="flex flex-col items-center gap-4">
        <XCircle size={64} className="text-red-500" />
        <h1 className="font-le-jour text-6xl tracking-wide uppercase">
          Payment Cancelled
        </h1>
        <p className="text-xl text-gray-600 max-w-md">
          The payment process was cancelled or failed. Your items are still in your bag.
        </p>
        <div className="mt-8 flex gap-4">
          <Link href="/checkout">
            <Button className="bg-black text-white px-8 py-3 text-sm tracking-widest uppercase hover:bg-gray-800">
              Try Again
            </Button>
          </Link>
          <Link href="/cart">
            <Button variant="outline" className="px-8 py-3 text-sm tracking-widest uppercase">
              Back to Bag
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
