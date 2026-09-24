import React from 'react'
import Image from 'next/image'
import { Button } from '../ui/button'

const categories = [
  { name: 'Earrings', image: '/images/category/earrings.webp' },
  { name: 'Necklaces', image: '/images/category/necklaces.webp' },
  { name: 'Bracelets', image: '/images/category/bracelets.webp' },
  { name: 'Rings', image: '/images/category/rings.webp' },
]

const ShopByCategory = () => {
  return (
    <section className="mx-20 my-10 flex flex-col items-center">
      <h3 className="font-le-jour text-3xl text-primary">Shop by Category</h3>

      <div className="my-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {categories.map((category, index) => (
          <div key={index} className="flex flex-col items-center">
            <div className="relative">
              <Image
                src={category.image}
                alt={category.name}
                width={200}
                height={200}
                className="h-auto w-full"
              />
              <Button
                variant="outline"
                className="absolute bottom-4 left-1/2 -translate-x-1/2 border-white bg-transparent text-white"
              >
                Shop Now
              </Button>
            </div>
            <h4 className="mt-4 text-2xl">{category.name}</h4>
          </div>
        ))}
      </div>
    </section>
  )
}

export default ShopByCategory
