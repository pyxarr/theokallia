import { Section, Text } from 'react-email'
import { brand } from './brand'

/** Brand wordmark header shared by every transactional email. */
export function EmailHeader() {
  return (
    <Section style={{ paddingBottom: '24px', borderBottom: `1px solid ${brand.border}` }}>
      <Text
        style={{
          fontFamily: brand.serif,
          fontSize: '24px',
          fontWeight: 700,
          letterSpacing: '0.2em',
          color: brand.primary,
          margin: 0,
        }}
      >
        THEOKALLIA
      </Text>
      <Text
        style={{
          fontFamily: brand.sans,
          fontSize: '11px',
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: brand.accent,
          margin: '4px 0 0',
        }}
      >
        Divine Beauty
      </Text>
    </Section>
  )
}

export default EmailHeader
