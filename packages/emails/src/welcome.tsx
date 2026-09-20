import { Section, Text } from 'react-email'
import { brand } from './_components/brand'
import type { EmailComponent } from './_components/email-component'
import { EmailButton } from './_components/email-button'
import { EmailLayout } from './_components/email-layout'

export interface WelcomeEmailProps {
  firstName: string
  couponCode: string
  discountPercent: number
  minOrder: number
  expiresInDays: number
}

/** Welcome email with the first-purchase coupon. */
export const WelcomeEmail: EmailComponent<WelcomeEmailProps> = ({
  firstName,
  couponCode,
  discountPercent,
  minOrder,
  expiresInDays,
}) => {
  return (
    <EmailLayout preview="Welcome to Theokallia — your first-order gift inside">
      <Text style={{ fontFamily: brand.sans, fontSize: '16px', color: brand.body }}>
        Hello {firstName},
      </Text>
      <Text style={{ fontFamily: brand.sans, fontSize: '14px', lineHeight: '1.6', color: brand.body }}>
        Welcome to Theokallia. As a thank-you, here is a gift toward your first order.
      </Text>
      <Section
        style={{
          border: `1px solid ${brand.accent}`,
          backgroundColor: brand.light,
          padding: '20px',
          textAlign: 'center',
          margin: '24px 0',
        }}
      >
        <Text
          style={{
            fontFamily: brand.serif,
            fontSize: '28px',
            letterSpacing: '0.15em',
            color: brand.primary,
            margin: 0,
          }}
        >
          {couponCode}
        </Text>
      </Section>
      <Text style={{ fontFamily: brand.sans, fontSize: '13px', lineHeight: '1.6', color: brand.body }}>
        Enjoy {discountPercent}% off your order over ₦{minOrder.toLocaleString()}. Valid for{' '}
        {expiresInDays} days.
      </Text>
      <div style={{ textAlign: 'center', margin: '24px 0' }}>
        <EmailButton href="https://theokallia.com/shop">Shop the collection</EmailButton>
      </div>
    </EmailLayout>
  )
}

WelcomeEmail.PreviewProps = {
  firstName: 'Ada',
  couponCode: 'WELCOME10',
  discountPercent: 10,
  minOrder: 20000,
  expiresInDays: 30,
}

export default WelcomeEmail
