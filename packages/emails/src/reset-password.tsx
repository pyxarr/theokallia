import { Text } from 'react-email'
import { brand } from './_components/brand'
import type { EmailComponent } from './_components/email-component'
import { EmailButton } from './_components/email-button'
import { EmailLayout } from './_components/email-layout'

export interface ResetPasswordEmailProps {
  firstName: string
  url: string
}

/** Password reset link email. The link expires in 1 hour. */
export const ResetPasswordEmail: EmailComponent<ResetPasswordEmailProps> = ({ firstName, url }) => {
  return (
    <EmailLayout preview="Reset your Theokallia password">
      <Text style={{ fontFamily: brand.sans, fontSize: '16px', color: brand.body }}>
        Hello {firstName},
      </Text>
      <Text style={{ fontFamily: brand.sans, fontSize: '14px', lineHeight: '1.6', color: brand.body }}>
        We received a request to reset your password. Choose a new one below.
      </Text>
      <div style={{ textAlign: 'center', margin: '24px 0' }}>
        <EmailButton href={url}>Reset my password</EmailButton>
      </div>
      <Text style={{ fontFamily: brand.sans, fontSize: '12px', color: brand.muted }}>
        This link expires in 1 hour. If you did not request a reset, your account is safe and you can
        ignore this email.
      </Text>
    </EmailLayout>
  )
}

ResetPasswordEmail.PreviewProps = {
  firstName: 'Ada',
  url: 'https://theokallia.com/reset-password?token=preview',
}

export default ResetPasswordEmail
