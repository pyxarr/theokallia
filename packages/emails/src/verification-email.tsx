import { Text } from 'react-email'
import { brand } from './_components/brand'
import type { EmailComponent } from './_components/email-component'
import { EmailButton } from './_components/email-button'
import { EmailLayout } from './_components/email-layout'

export interface VerificationEmailProps {
  firstName: string
  url: string
}

/** Verification link email sent on signup. The link expires in 1 hour. */
export const VerificationEmail: EmailComponent<VerificationEmailProps> = ({ firstName, url }) => {
  return (
    <EmailLayout preview="Confirm your Theokallia email address">
      <Text style={{ fontFamily: brand.sans, fontSize: '16px', color: brand.body }}>
        Hello {firstName},
      </Text>
      <Text style={{ fontFamily: brand.sans, fontSize: '14px', lineHeight: '1.6', color: brand.body }}>
        Welcome to Theokallia. Confirm your email address to finish creating your account.
      </Text>
      <div style={{ textAlign: 'center', margin: '24px 0' }}>
        <EmailButton href={url}>Verify my email</EmailButton>
      </div>
      <Text style={{ fontFamily: brand.sans, fontSize: '12px', color: brand.muted }}>
        This link expires in 1 hour. If you did not create an account, you can ignore this email.
      </Text>
    </EmailLayout>
  )
}

VerificationEmail.PreviewProps = {
  firstName: 'Ada',
  url: 'https://theokallia.com/verify-email?token=preview',
}

export default VerificationEmail
