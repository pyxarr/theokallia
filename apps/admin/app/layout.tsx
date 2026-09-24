import type { Metadata } from 'next'
import './globals.css'
import { Cormorant_Garamond } from 'next/font/google'
import localFont from 'next/font/local'
import { QueryProvider } from '@/lib/providers/query-provider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'

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
  title: 'Theokallia Admin',
  description: 'Admin dashboard for Theokallia',
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
          <TooltipProvider>
            {children}
          </TooltipProvider>
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  )
}