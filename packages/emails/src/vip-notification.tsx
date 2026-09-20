import { Section, Text } from 'react-email'
import { brand } from './_components/brand'
import type { EmailComponent } from './_components/email-component'
import { EmailLayout } from './_components/email-layout'

export interface VipNotificationEmailProps {
  customerName: string
  customerEmail: string
  totalOrders: number
  totalSpend: number
  dateAchieved: string
}

/** Internal admin alert when a customer qualifies for VIP status. */
export const VipNotificationEmail: EmailComponent<VipNotificationEmailProps> = ({
  customerName,
  customerEmail,
  totalOrders,
  totalSpend,
  dateAchieved,
}) => {
  return (
    <EmailLayout preview={`New VIP customer — ${customerName}`}>
      <Text style={{ fontFamily: brand.sans, fontSize: '16px', color: brand.body }}>
        New VIP customer
      </Text>
      <Text style={{ fontFamily: brand.sans, fontSize: '14px', lineHeight: '1.6', color: brand.body }}>
        A customer has qualified for VIP status.
      </Text>
      <Section style={{ border: `1px solid ${brand.border}`, padding: '20px', margin: '24px 0' }}>
        <Text style={{ fontFamily: brand.sans, fontSize: '13px', color: brand.body, margin: '2px 0' }}>
          <strong>Name:</strong> {customerName}
        </Text>
        <Text style={{ fontFamily: brand.sans, fontSize: '13px', color: brand.body, margin: '2px 0' }}>
          <strong>Email:</strong> {customerEmail}
        </Text>
        <Text style={{ fontFamily: brand.sans, fontSize: '13px', color: brand.body, margin: '2px 0' }}>
          <strong>Qualifying orders:</strong> {totalOrders}
        </Text>
        <Text style={{ fontFamily: brand.sans, fontSize: '13px', color: brand.body, margin: '2px 0' }}>
          <strong>Lifetime spend:</strong> ₦{totalSpend.toLocaleString()}
        </Text>
        <Text style={{ fontFamily: brand.sans, fontSize: '13px', color: brand.muted, margin: '2px 0' }}>
          <strong>Achieved:</strong> {dateAchieved}
        </Text>
      </Section>
    </EmailLayout>
  )
}

VipNotificationEmail.PreviewProps = {
  customerName: 'Ada Lovelace',
  customerEmail: 'ada@example.com',
  totalOrders: 5,
  totalSpend: 250000,
  dateAchieved: new Date().toISOString(),
}

export default VipNotificationEmail
