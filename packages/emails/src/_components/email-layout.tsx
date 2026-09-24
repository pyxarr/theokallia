import { Body, Container, Head, Html, Preview } from 'react-email'
import type { ReactNode } from 'react'
import { brand } from './brand'
import { EmailHeader } from './email-header'
import { EmailFooter } from './email-footer'

interface EmailLayoutProps {
  /** Inbox preview text shown before the email is opened. */
  preview: string
  children: ReactNode
}

/**
 * Shared shell for every Theokallia email: html/head/body/container with the
 * brand header and footer, centred on a light background. Sharp corners.
 */
export function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: brand.light, fontFamily: brand.sans, margin: 0, padding: '24px 0' }}>
        <Container
          style={{
            backgroundColor: brand.white,
            maxWidth: '480px',
            margin: '0 auto',
            padding: '40px 32px',
            border: `1px solid ${brand.border}`,
            borderRadius: 0,
          }}
        >
          <EmailHeader />
          {children}
          <EmailFooter />
        </Container>
      </Body>
    </Html>
  )
}

export default EmailLayout
