import { Button } from 'react-email'
import type { CSSProperties, ReactNode } from 'react'
import { brand } from './brand'

interface EmailButtonProps {
  href: string
  children: ReactNode
  style?: CSSProperties
}

/**
 * Sharp-corner call-to-action button — purple background, white uppercase label.
 * Border-radius stays 0 per the brand design system.
 */
export function EmailButton({ href, children, style }: EmailButtonProps) {
  return (
    <Button
      href={href}
      style={{
        display: 'inline-block',
        backgroundColor: brand.primary,
        color: brand.white,
        padding: '14px 28px',
        fontFamily: brand.sans,
        fontSize: '12px',
        fontWeight: 600,
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        textDecoration: 'none',
        borderRadius: 0,
        ...style,
      }}
    >
      {children}
    </Button>
  )
}

export default EmailButton
