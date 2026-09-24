import { API_VERSION } from '@/lib/api'
import { env } from '@/lib/env'
import { NextRequest, NextResponse } from 'next/server'

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  // resolve the dynamic path segments
  // e.g. /api/auth/login → path = ['auth', 'login']
  const { path } = await params

  // preserve query string from the incoming request
  // e.g. ?category=bracelets&page=1
  const search = req.nextUrl.search

  const isAuthRoute = path[0] === 'auth'
  const apiUrl =
    process.env.API_URL ??
    (process.env.NODE_ENV === 'development' ? 'http://localhost:3333' : '')

  if (!apiUrl) {
    throw new Error('API_URL is required in production')
  }

  // reconstruct the upstream URL with the API version and query string
  // auth stays on the Better Auth base path, while everything else stays versioned.
  const url = isAuthRoute
    ? `${apiUrl}/api/auth/${path.slice(1).join('/')}${search}`
    : `${apiUrl}/${API_VERSION}/${path.join('/')}${search}`

  // forward the request to NestJS
  const res = await fetch(url, {
    method: req.method,

    headers: {
      'Content-Type': 'application/json',
      // Better Auth rejects requests with no Origin, so forward the browser origin.
      origin: req.headers.get('origin') ?? env.NEXT_PUBLIC_APP_URL,
      // forward the browser's cookies so the upstream auth/session middleware can read them
      cookie: req.headers.get('cookie') ?? '',
    },

    // only attach a body for non-GET/HEAD requests (GET has no body)
    body:
      req.method !== 'GET' && req.method !== 'HEAD'
        ? await req.text()
        : undefined,
    cache: 'no-store',
  })

  // parse the NestJS response — catch handles empty responses (e.g. 204 No Content)
  const data = await res.json().catch(() => null)

  // build the Next.js response, preserving the NestJS status code
  const response = NextResponse.json(data, { status: res.status })

  // forward ALL set-cookie headers from NestJS back to the browser
  // using forEach + append instead of get() because get() only returns the first cookie
  // this ensures both access_token and refresh_token cookies are forwarded correctly
  res.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') {
      response.headers.append('set-cookie', value)
    }
  })

  return response
}

// export each HTTP method — they all go through the same handler
export const GET = handler
export const POST = handler
export const PATCH = handler
export const PUT = handler
export const DELETE = handler
