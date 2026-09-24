import Image from 'next/image'
import Link from 'next/link'

const shopLinks = [
  { label: 'Earrings', href: '#' },
  { label: 'Necklaces', href: '#' },
  { label: 'Bracelets', href: '#' },
  { label: 'Rings', href: '#' },
]

const quickLinks = [
  { label: 'Contact us', href: '#' },
  { label: 'About us', href: '#' },
  { label: 'FAQs', href: '#' },
]

const accountLinks = [
  { label: 'Sign up', href: '#' },
  { label: 'Log in', href: '#' },
  { label: 'Cart', href: '#' },
  { label: 'Orders', href: '#' },
]

const legalLinks = [
  { label: 'Privacy policy', href: '#' },
  { label: 'Terms and Conditions', href: '#' },
]

const socialLinks = [
  { label: 'Telegram', href: '#' },
  { label: 'Instagram', href: '#' },
]

const FooterColumn = ({
  heading,
  links,
}: {
  heading: string
  links: { label: string; href: string }[]
}) => (
  <div className="flex flex-col gap-4">
    <h4 className="font-cormorant-garamond text-lg font-bold text-slate-900">
      {heading}
    </h4>
    {links.map((link) => (
      <Link
        key={link.label}
        href={link.href}
        className="font-cormorant-garamond text-base text-slate-900 hover:text-gray-900"
      >
        {link.label}
      </Link>
    ))}
  </div>
)

const Footer = () => {
  return (
    <footer className="bg-footer container mx-auto w-full px-20 pt-16">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex justify-between gap-10">
            <FooterColumn heading="Shop" links={shopLinks} />
            <FooterColumn heading="Quick links" links={quickLinks} />
            <FooterColumn heading="Accounts" links={accountLinks} />
            <FooterColumn heading="Legal" links={legalLinks} />
          </div>
        </div>

        {/* Socials */}
        <div className="flex flex-col gap-4">
          <h4 className="font-cormorant-garamond text-2xl font-bold text-gray-900">
            Socials
          </h4>
          {socialLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="font-cormorant-garamond text-base text-slate-900"
            >
              {link.label}
            </Link>
          ))}
          <p className="mt-16 font-cormorant-garamond text-base text-slate-900">
            © 2026 Theokallia Jewellry
          </p>
        </div>
      </div>

      {/* Bottom — Logo */}
      <div className="mt-16 flex flex-col items-center gap-1">
        <div className="relative h-32 w-48">
          <Image
            src="/logo-dark.webp"
            alt="Theokallia"
            fill
            sizes="(max-width: 768px) 192px, 192px"
            className="object-contain"
          />
        </div>
      </div>
    </footer>
  )
}

export default Footer
