import Image from 'next/image'
import { Button } from '../ui/button'

const Banner = () => {
  return (
    <section className="relative container mx-auto my-10 h-screen w-full overflow-hidden">
      <Image
        src="/images/banner-image.webp"
        alt="Banner"
        fill
        priority
        className="object-cover"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/10" />

      {/* Content */}
      <div className="absolute top-5/8 left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-6">
        <div className="relative flex items-end">
          <Image
            src="/icons/crown-2.svg"
            alt="crown"
            width={60}
            height={60}
            style={{ width: 'auto', height: 'auto' }}
            className="absolute bottom-36 -left-16"
          />
          <h1 className="font-le-jour text-[10rem] leading-none font-medium tracking-widest text-white uppercase">
            THEOKALLIA
          </h1>
        </div>

        <Button className="border border-white bg-primary/10 px-10 py-6 text-lg tracking-widest text-white">
          Shop Now
        </Button>

        <div className="mt-6 flex items-center gap-6 text-gray-50">
          <span className="font-cormorant-garamond text-2xl tracking-widest">
            Beauty
          </span>
          <div className="h-px w-20 bg-gray-50" />
          <span className="font-le-jour text-6xl text-yellow-500">2026</span>
          <div className="h-px w-20 bg-gray-50" />
          <span className="font-cormorant-garamond text-2xl tracking-widest">
            Elegance
          </span>
        </div>

        <p className="font-cormorant-garamond text-xl tracking-widest text-yellow-500">
          Jewelry store
        </p>
      </div>
    </section>
  )
}

export default Banner
