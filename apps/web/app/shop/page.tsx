import ShopBanner from '@/components/shop/shop-banner'
import ShopHeader from '@/components/shop/shop-header'
import SidebarFilter from '@/components/shop/sidebar-filter'
import ProductGrid from '@/components/shop/product-grid'
import React, { Suspense, ViewTransition } from 'react'

const ShopPage = () => {
  return (
    <ViewTransition>
      <div className="w-full">
        <ShopHeader />
        <ShopBanner />

        <div className="flex flex-col items-center justify-center bg-white px-20 py-20">
          <h2 className="text-center font-le-jour text-3xl">Discover Elegance</h2>
          <p className="mt-2 max-w-3xl text-center font-cormorant-garamond text-xl/6 tracking-wide">
            Discover pieces designed to shine with you, every day.
          </p>
        </div>

        <div className="relative z-0 flex items-start gap-8 px-10 pb-20">
          <div className="sticky top-4 self-start">
            <Suspense>
              <SidebarFilter />
            </Suspense>
          </div>
          <Suspense>
            <ProductGrid />
          </Suspense>
        </div>
      </div>
    </ViewTransition>
  )
}

export default ShopPage
