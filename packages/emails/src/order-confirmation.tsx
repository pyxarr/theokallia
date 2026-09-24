import { Hr, Section, Text } from 'react-email'
import { brand } from './_components/brand'
import type { EmailComponent } from './_components/email-component'
import { EmailButton } from './_components/email-button'
import { EmailLayout } from './_components/email-layout'

export interface OrderConfirmationEmailProps {
  firstName: string
  orderId: string
  items: Array<{ name: string; quantity: number; price: number }>
  subtotal: number
  discount: number
  shippingFee: number
  total: number
  shippingAddress: {
    street: string
    city: string
    state: string
    country: string
  }
}

function row(label: string, value: string) {
  return (
    <Text style={{ fontFamily: brand.sans, fontSize: '13px', color: brand.body, margin: '2px 0' }}>
      <span style={{ display: 'inline-block', minWidth: '180px', color: brand.muted }}>{label}</span>
      {value}
    </Text>
  )
}

/** Order confirmation email sent once payment is verified. */
export const OrderConfirmationEmail: EmailComponent<OrderConfirmationEmailProps> = ({
  firstName,
  orderId,
  items,
  subtotal,
  discount,
  shippingFee,
  total,
  shippingAddress,
}) => {
  return (
    <EmailLayout preview={`Order confirmed — ${orderId}`}>
      <Text style={{ fontFamily: brand.sans, fontSize: '16px', color: brand.body }}>
        Thank you, {firstName}
      </Text>
      <Text style={{ fontFamily: brand.sans, fontSize: '14px', lineHeight: '1.6', color: brand.body }}>
        We have received your payment and are preparing your pieces.
      </Text>
      <Text style={{ fontFamily: brand.sans, fontSize: '13px', color: brand.muted }}>
        Order #{orderId.slice(-8).toUpperCase()}
      </Text>

      <Section style={{ margin: '20px 0' }}>
        {items.map((item, i) => (
          <Text key={i} style={{ fontFamily: brand.sans, fontSize: '13px', color: brand.body, margin: '2px 0' }}>
            {item.quantity}× {item.name} — ₦{(item.price * item.quantity).toLocaleString()}
          </Text>
        ))}
      </Section>

      <Hr style={{ borderColor: brand.border, margin: '16px 0' }} />
      {row('Subtotal', `₦${subtotal.toLocaleString()}`)}
      {discount > 0 ? row('Discount', `-₦${discount.toLocaleString()}`) : null}
      {row('Shipping', `₦${shippingFee.toLocaleString()}`)}
      <Text style={{ fontFamily: brand.serif, fontSize: '16px', color: brand.dark, margin: '8px 0 0' }}>
        <span style={{ display: 'inline-block', minWidth: '180px' }}>Total</span>₦
        {total.toLocaleString()}
      </Text>
      <Hr style={{ borderColor: brand.border, margin: '16px 0' }} />

      <Text style={{ fontFamily: brand.sans, fontSize: '13px', color: brand.body, margin: '0 0 4px' }}>
        Deliver to
      </Text>
      <Text style={{ fontFamily: brand.sans, fontSize: '13px', color: brand.muted, margin: 0 }}>
        {shippingAddress.street}, {shippingAddress.city}, {shippingAddress.state},{' '}
        {shippingAddress.country}
      </Text>

      <div style={{ textAlign: 'center', margin: '24px 0 8px' }}>
        <EmailButton href="https://theokallia.com/account/orders">View my order</EmailButton>
      </div>
      <Text style={{ fontFamily: brand.sans, fontSize: '12px', color: brand.muted }}>
        We will email you when your order ships.
      </Text>
    </EmailLayout>
  )
}

OrderConfirmationEmail.PreviewProps = {
  firstName: 'Ada',
  orderId: 'ord_preview_001',
  items: [
    { name: 'Temi Gold Bracelet', quantity: 1, price: 45000 },
    { name: 'Adaeze Earrings', quantity: 1, price: 30000 },
  ],
  subtotal: 75000,
  discount: 0,
  shippingFee: 3000,
  total: 78000,
  shippingAddress: { street: '12 Admiralty Way', city: 'Lekki', state: 'Lagos', country: 'Nigeria' },
}

export default OrderConfirmationEmail
