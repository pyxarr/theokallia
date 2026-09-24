import type { Metadata } from 'next'
import './globals.css'
import { Cormorant_Garamond } from 'next/font/google'
import localFont from 'next/font/local'
import ClientLayout from '@/components/client-layout'
import { QueryProvider } from '@/lib/providers/query-provider'

const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-cormorant-garamond',
})

const leJour = localFont({
  src: '../public/fonts/Le Jour Serif Personal Use Only.otf',
  variable: '--font-le-jour',
  display: 'swap',
})

const allure = localFont({
  src: '../public/fonts/Allure.otf',
  variable: '--font-allure',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Theokallia',
  description: 'Timeless Elegance Crafted for You',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${cormorantGaramond.variable} ${leJour.variable} ${allure.variable} flex min-h-full flex-col antialiased`}
      >
        <QueryProvider>
          <ClientLayout>{children}</ClientLayout>
        </QueryProvider>
      </body>
    </html>
  )
}
