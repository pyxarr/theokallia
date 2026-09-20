import { Hr, Link, Section, Text } from 'react-email'
import { brand } from './brand'

/** Shared footer with the brand line and shop/contact links. */
export function EmailFooter() {
  return (
    <Section style={{ marginTop: '32px' }}>
      <Hr style={{ borderColor: brand.border, margin: '0 0 16px' }} />
      <Text style={{ fontFamily: brand.sans, fontSize: '12px', color: brand.muted, margin: '0 0 6px' }}>
        Theokallia · Handcrafted luxury jewellery
      </Text>
      <Text style={{ fontFamily: brand.sans, fontSize: '12px', color: brand.muted, margin: 0 }}>
        <Link href="https://theokallia.com/shop" style={{ color: brand.primary }}>
          Shop
        </Link>
        {' · '}
        <Link href="https://theokallia.com/contact" style={{ color: brand.primary }}>
          Contact
        </Link>
      </Text>
    </Section>
  )
}

export default EmailFooter
