'use client'

import { useState } from 'react'
import { ViewTransition } from 'react'
import Image from 'next/image'

interface Asset {
  id: string
  publicId: string
  altText: string | null
  sortOrder: number
  resourceType: string
  entityType: string
  entityId: string
}

interface ProductImagesProps {
  assets: Asset[]
  productName: string
  slug: string
}

const ProductImages = ({ assets, productName, slug }: ProductImagesProps) => {
  const [activeIndex, setActiveIndex] = useState(0)

  return (
    <div className="flex flex-col gap-3">
       {/* Main Image */}
       <div className="relative aspect-square w-full overflow-hidden bg-[#f5f0eb]">
         {assets[activeIndex]?.publicId ? (
           <ViewTransition name={slug}>
             <Image
               src={assets[activeIndex].publicId}
               alt={productName}
               fill
               className="object-cover"
               sizes="(max-width: 768px) 100vw, 50vw"
               priority
             />
           </ViewTransition>
         ) : (
           <div className="flex h-full w-full items-center justify-center text-gray-400">
             No image available
           </div>
         )}
       </div>

      {/* Thumbnails */}
      <div className="grid grid-cols-4 gap-3">
        {assets.map((asset, index) => {
          const isActive = activeIndex === index

          return (
            <button
              key={asset.id}
              onClick={() => setActiveIndex(index)}
              className={`relative aspect-square overflow-hidden bg-[#f5f0eb] transition-opacity ${
                isActive
                  ? 'opacity-100'
                  : 'opacity-80 hover:opacity-100'
              }`}
            >
              <Image
                src={asset.publicId}
                alt={asset.altText ?? `${productName} view ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 25vw, 12vw"
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default ProductImages
