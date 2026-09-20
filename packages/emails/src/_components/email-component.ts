import type { ReactElement } from 'react'

/**
 * A React Email template component. `PreviewProps` is the React Email CLI
 * convention for supplying demo data to the preview server; it is optional
 * and unused at send-time.
 */
export type EmailComponent<P> = ((props: P) => ReactElement) & { PreviewProps?: P }
