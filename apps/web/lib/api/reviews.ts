import { cache } from 'react'

const API_URL = process.env.API_URL ?? (process.env.NODE_ENV === 'development' ? 'http://localhost:3333' : '')

if (!API_URL && process.env.NODE_ENV === 'production') {
  throw new Error('API_URL is required in production')
}

/**
 * Server-side reviews fetch — cached per request for SEO/FCP.
 */
export const getReviews = cache(async (slug: string) => {
  try {
    const res = await fetch(`${API_URL}/v1/products/${slug}/reviews`, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
})