import { Gem, BookMarked, Truck } from 'lucide-react'
import Image from 'next/image'

const features = [
  {
    icon: <Gem size={32} className="text-purple-700" strokeWidth={1} />,
    title: 'Premium Materials',
    description:
      'Crafted using carefully selected gold, silver, and high-quality gemstones.',
  },
  {
    icon: <BookMarked size={32} className="text-purple-700" strokeWidth={1} />,
    title: 'Free Packaging',
    description:
      'Crafted using carefully selected gold, silver, and high-quality gemstones.',
  },
  {
    icon: <Truck size={32} className="text-purple-700" strokeWidth={1} />,
    title: 'Fast Delivery',
    description:
      'Enjoy quick and reliable shipping so your jewelry reaches you without delay.',
  },
]

const Features = () => {
  return (
    <section className="container mx-auto w-full px-20 py-10">
      <div className="flex items-center justify-center gap-8">
        <div className="relative h-[400px] w-[320px] overflow-hidden rounded-tr-[60px] rounded-bl-[60px] bg-neutral-25">
          <Image
            src="/images/texture.webp"
            alt="texture"
            fill
            loading="eager"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="fill-neutral-25 object-cover"
          />

          <div className="font-cormorant-garamond absolute inset-0 flex flex-col items-center justify-center gap-4 text-black">
            {features[0]?.icon}
            <div className="flex flex-col items-center justify-center space-y-2">
              <h3 className="text-2xl font-normal">{features[0]?.title}</h3>
              <p className="mx-4 text-center text-base">
                {features[0]?.description}
              </p>
            </div>
          </div>
        </div>

        <div className="relative h-[400px] w-[320px] overflow-hidden rounded-tl-[60px] rounded-br-[60px] bg-neutral-25">
          <Image
            src="/images/texture.webp"
            alt="texture"
            fill
            loading="eager"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
          />

          <div className="font-cormorant-garamond absolute inset-0 flex flex-col items-center justify-center gap-4 text-black">
            {features[1]?.icon}
            <div className="flex flex-col items-center justify-center space-y-2">
              <h3 className="text-2xl font-normal">{features[1]?.title}</h3>
              <p className="mx-4 text-center text-base">
                {features[1]?.description}
              </p>
            </div>
          </div>
        </div>

        <div className="relative h-[400px] w-[320px] overflow-hidden rounded-tl-[60px] rounded-br-[60px] bg-neutral-25">
          <Image
            src="/images/texture.webp"
            alt="texture"
            fill
            loading="eager"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
          />

          <div className="font-cormorant-garamond absolute inset-0 flex flex-col items-center justify-center gap-4 text-black">
            {features[2]?.icon}
            <div className="flex flex-col items-center justify-center space-y-2">
              <h3 className="text-2xl font-normal">{features[2]?.title}</h3>
              <p className="mx-4 text-center text-base">
                {features[2]?.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Features
