import Image from 'next/image'
import React from 'react'

const ShopBanner = () => {
  return (
    <section>
      <div className="flex items-center justify-between bg-primary px-3 py-6 pt-4 text-white">
        <h3 className="font-le-jour text-4xl">
          Luxury <span className="text-8xl font-allure">Jewelry</span> For You
        </h3>
        <p className="w-2xs">
          Discover pieces designed to shine with you, every day.
        </p>
      </div>
      <div className="flex h-[400px] w-full">
        <div className="relative flex-1">
          <Image
            src="/images/necklace-2.webp"
            fill
            alt="Necklace"
            sizes="(max-width: 768px) 50vw, 25vw"
            loading="eager"
            className="object-fill"
          />
        </div>
        <div className="relative flex-1">
          <Image
            src="/images/category/rings.webp"
            fill
            alt="Rings"
            sizes="(max-width: 768px) 50vw, 25vw"
            loading="eager"
            className="object-cover"
          />
        </div>
        <div className="relative flex-1">
          <Image
            src="/images/category/bracelets.webp"
            fill
            alt="Bracelet"
            sizes="(max-width: 768px) 50vw, 25vw"
            loading="eager"
            className="object-cover"
          />
        </div>
        <div className="relative flex-1">
          <Image
            src="/images/earring-2.webp"
            fill
            alt="Earrings"
            sizes="(max-width: 768px) 50vw, 25vw"
            loading="eager"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  )
}

export default ShopBanner
