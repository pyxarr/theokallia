import Features from '@/components/homepage/features'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'
import React, { ViewTransition } from 'react'

const page = () => {
  return (
    <ViewTransition>
      <div className="w-full">
        <div className="flex items-center gap-16 bg-neutral-25 px-30 py-20">
          <div className="w-[380px] shrink-0">
            <Image
              src="/images/necklace-3.webp"
              alt="About Theokallia"
              width={380}
              height={480}
              className="h-full w-full object-cover"
              style={{ width: 'auto', height: 'auto' }}
            />
          </div>

          <div className="mt-4 flex max-w-2xl flex-col space-y-10">
            <h1 className="font-le-jour text-6xl tracking-tight uppercase">
              About Us
            </h1>
            <p className="font-cormorant-garamond text-2xl/8 font-light text-black">
              At Theokallia, we believe jewelry is more than an accessory &apos; it&apos;s a
              reflection of identity, elegance, and timeless beauty. Every piece
              is thoughtfully designed to elevate your everyday style while
              celebrating life&apos;s most meaningful moments.
            </p>

            <div>
              <Button
                asChild
                className="px-6 py-4 tracking-wide transition-colors"
              >
                <Link href="/shop">Shop</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center pt-10">
          <h2 className="font-cormorant-garamond text-2xl font-light tracking-wide">
            Why choose us
          </h2>
          <Features />
        </div>
      </div>
    </ViewTransition>
  )
}

export default page
