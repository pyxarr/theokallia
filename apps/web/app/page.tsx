import React, { ViewTransition } from 'react'
import HeroSection from '@/components/homepage/hero-section'
import ShopByCategory from '@/components/homepage/shop-by-category'
import ShopPromotion from '@/components/homepage/shop-promotion'
import WhyChooseUs from '@/components/homepage/why-choose-us'
import Reviews from '@/components/homepage/reviews'
import Features from '@/components/homepage/features'
import Banner from '@/components/homepage/banner'
import NewsLetter from '@/components/homepage/news-letter'

const page = () => {
  return (
    <ViewTransition>
      <div>
        <HeroSection />
        <ShopByCategory />
        <ShopPromotion />
        <WhyChooseUs />
        <Reviews />
        <Features />
        <Banner />
        <NewsLetter />
      </div>
    </ViewTransition>
  )
}

export default page
