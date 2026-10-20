import type { AuthStrategy } from 'payload'
import { cache } from 'react'

import { getAuthStore } from './auth-context'

type PayloadAuthSessionUser = {
  id?: string
  name?: string | null
  email?: string
  role?: string
}

/**
 * Validates the Better Auth session issued by apps/api instead of asking for
 * a second login. The `origin` header is required: better-auth rejects
 * requests with no Origin, and a server-side fetch sends none by default.
 *
 * Keyed on the cookie, not the Headers object, so two callers in the same
 * request that carry the same cookie share one call to apps/api.
 */
const fetchSessionUser = cache(async (cookie: string): Promise<PayloadAuthSessionUser | null> => {
  const response = await fetch(`${process.env.API_URL}/api/auth/get-session`, {
    headers: {
      cookie,
      origin: process.env.NEXT_PUBLIC_APP_URL ?? '',
    },
    // The session must never come from Next's fetch cache — one user's
    // cookie must not be able to answer another's request.
    cache: 'no-store',
    signal: AbortSignal.timeout(5000),
    // Abort and network failure both mean "no session", not "hang".
  }).catch(() => null)

  if (!response?.ok) {
    return null
  }

  const session = (await response.json().catch(() => null)) as {
    user?: PayloadAuthSessionUser
  } | null
  const user = session?.user

  // This is the whole /studio gate — non-admins get nothing.
  if (!user?.id || !user.email || user.role !== 'admin') {
    return null
  }

  return user
})

/**
 * Shared by the auth strategy and the /studio layout guard, so the rule that
 * says "admin or nobody" is written once. `cache` keeps one /studio page from
 * asking apps/api the same question twice where possible.
 */
export const getAuthUser = async (headers: Headers): Promise<PayloadAuthSessionUser | null> => {
  const store = getAuthStore()
  if (store) {
    return store.user
  }

  const cookie = headers.get('cookie')
  if (!cookie) {
    return null
  }

  return fetchSessionUser(cookie)
}

export const payloadAuthStrategy: AuthStrategy = {
  name: 'better-auth',
  authenticate: async ({ payload, headers }) => {
    const user = await getAuthUser(headers)
    if (!user) {
      return { user: null }
    }

    const existing = await payload.find({
      collection: 'users',
      where: { payloadAuthUserId: { equals: user.id } },
      limit: 1,
      overrideAccess: true,
    })

    if (existing.docs[0]) {
      return { user: { ...existing.docs[0], collection: 'users' } }
    }

    try {
      const doc = await payload.create({
        collection: 'users',
        data: {
          email: user.email,
          name: user.name ?? '',
          payloadAuthUserId: user.id,
          role: user.role,
        },
        overrideAccess: true,
      })
      return { user: { ...doc, collection: 'users' } }
    } catch {
      // Another request created the user concurrently — re-find it.
      const retry = await payload.find({
        collection: 'users',
        where: { payloadAuthUserId: { equals: user.id } },
        limit: 1,
        overrideAccess: true,
      })
      if (retry.docs[0]) {
        return { user: { ...retry.docs[0], collection: 'users' } }
      }
      return { user: null }
    }
  },
}
