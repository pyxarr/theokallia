import React from 'react'
import Image from 'next/image'
import { Button } from '../ui/button'

const ShopPromotion = () => {
  return (
    <section className="my-20 w-full overflow-hidden">
      <div className="mx-20 flex items-center justify-center gap-1.5">
        <div className="relative h-[620px] w-[400px] overflow-hidden">
          <Image
            src="/images/promotion/promotion-1.webp"
            alt="Gold bracelet"
            fill
            sizes="400px"
            loading="eager"
            className="object-cover object-center"
          />
        </div>

        <div className="relative z-10 h-[700px] w-[500px] shrink-0 overflow-hidden">
          <Image
            src="/images/promotion/promotion-2.webp"
            alt="Silver bow necklace"
            fill
            sizes="500px"
            loading="eager"
            className="object-cover object-center"
          />

          {/* Logo */}
          <div className="absolute top-8 left-2 z-10 h-20 w-60">
            <Image
              src="/logo-light.webp"
              alt="Theokallia Logo"
              fill
              sizes="240px"
              loading="eager"
              className="object-contain"
            />
          </div>

          {/* Promo Text */}
          <div className="absolute right-0 bottom-28 left-0 px-6 text-center font-cormorant-garamond">
            <h2 className="mb-4 font-le-jour text-5xl leading-tight font-thin tracking-widest text-white uppercase">
              ENJOY
              <br />
              10% OFF
            </h2>
            <p className="mb-2 text-3xl font-light tracking-wide text-white">
              On all orders above ₦20,000
            </p>
            <p className="mb-6 text-sm tracking-wider text-white/70">
              Only Available from March 6th - March 20th
            </p>
            <div className="mt-2 flex justify-center">
              <Button className="px-10 py-6 text-lg font-semibold tracking-widest text-white transition-colors">
                Shop Now
              </Button>
            </div>
          </div>
        </div>

        {/* Right Panel — Ring */}
        <div className="relative h-[620px] w-[400px] overflow-hidden">
          <Image
            src="/images/promotion/promotion-3.webp"
            alt="Gold leaf ring"
            fill
            sizes="400px"
            loading="eager"
            className="object-cover object-center"
          />
        </div>
      </div>
    </section>
  )
}

export default ShopPromotion
