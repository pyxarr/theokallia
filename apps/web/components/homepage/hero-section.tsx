import React from 'react'
import Image from 'next/image'
import { Button } from '../ui/button'
import Link from 'next/link'

const HeroSection = () => {
  return (
    <section className="relative w-full">
      <div className="relative container mx-auto">
        <div className="relative h-[60vh] md:h-[80vh]">
          <Image
            src="/images/hero/hero-image.webp"
            alt="Theokallia Hero"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>

        <div className="absolute bottom-1/4 left-30 flex flex-col items-start space-y-4">
          <h1 className="font-le-jour text-4xl text-white md:text-7xl">
            TIMELESS ELEGANCE
            <br />
            CRAFTED FOR YOU
          </h1>

          <p className="mt-4 text-2xl text-white">
            Curated collections of rings, necklaces, and bracelets
            <br />
            crafted with passion and precision.
          </p>

          <Button className="mt-4 px-8 py-6" asChild>
            <Link href="/shop">Shop Now</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
