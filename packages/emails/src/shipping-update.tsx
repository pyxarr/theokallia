import { Section, Text } from 'react-email'
import { brand } from './_components/brand'
import type { EmailComponent } from './_components/email-component'
import { EmailButton } from './_components/email-button'
import { EmailLayout } from './_components/email-layout'

export interface ShippingUpdateEmailProps {
  firstName: string
  orderId: string
  trackingNumber: string
}

/** Shipping update email sent when an order is marked shipped. */
export const ShippingUpdateEmail: EmailComponent<ShippingUpdateEmailProps> = ({
  firstName,
  orderId,
  trackingNumber,
}) => {
  return (
    <EmailLayout preview={`Your order has shipped — tracking ${trackingNumber}`}>
      <Text style={{ fontFamily: brand.sans, fontSize: '16px', color: brand.body }}>
        Hello {firstName},
      </Text>
      <Text style={{ fontFamily: brand.sans, fontSize: '14px', lineHeight: '1.6', color: brand.body }}>
        Your order #{orderId.slice(-8).toUpperCase()} is on its way.
      </Text>
      <Section
        style={{
          border: `1px solid ${brand.border}`,
          backgroundColor: brand.light,
          padding: '20px',
          textAlign: 'center',
          margin: '24px 0',
        }}
      >
        <Text style={{ fontFamily: brand.sans, fontSize: '12px', color: brand.muted, margin: '0 0 4px' }}>
          Tracking number
        </Text>
        <Text style={{ fontFamily: brand.serif, fontSize: '20px', letterSpacing: '0.1em', color: brand.dark, margin: 0 }}>
          {trackingNumber}
        </Text>
      </Section>
      <Text style={{ fontFamily: brand.sans, fontSize: '13px', color: brand.body }}>
        Estimated delivery: 3–5 business days.
      </Text>
      <div style={{ textAlign: 'center', margin: '24px 0' }}>
        <EmailButton href="https://theokallia.com/account/orders">Track my order</EmailButton>
      </div>
    </EmailLayout>
  )
}

ShippingUpdateEmail.PreviewProps = {
  firstName: 'Ada',
  orderId: 'ord_preview_001',
  trackingNumber: 'DHL123456789',
}

export default ShippingUpdateEmail
