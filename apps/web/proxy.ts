import { NextResponse, type NextRequest } from 'next/server'

const COUNTRY_COOKIE = 'theokallia_country'
const CURRENCY_COOKIE = 'theokallia_currency'

/**
 * Records the visitor's country (from Vercel's geo header) in a cookie so the
 * currency store can pick a sensible default on first visit. A manual currency
 * choice always wins — the country cookie is never written once one exists.
 */
export function proxy(request: NextRequest) {
  const response = NextResponse.next()

  const hasCurrencyChoice = request.cookies.has(CURRENCY_COOKIE)
  const hasCountry = request.cookies.has(COUNTRY_COOKIE)
  const country = request.headers.get('x-vercel-ip-country')

  if (!hasCurrencyChoice && !hasCountry && country) {
    response.cookies.set(COUNTRY_COOKIE, country.toUpperCase(), {
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      sameSite: 'lax',
    })
  }

  return response
}

export const config = {
  // pages only — skip the API proxy, Next internals, and static assets
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:webp|png|jpg|jpeg|svg|otf|woff2?)$).*)',
  ],
}
