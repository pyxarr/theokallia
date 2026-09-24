import { cache } from 'react'

const API_URL = process.env.API_URL ?? (process.env.NODE_ENV === 'development' ? 'http://localhost:3333' : '')

if (!API_URL && process.env.NODE_ENV === 'production') {
  throw new Error('API_URL is required in production')
}

/**
 * Server-side product fetch — cached per request for SEO/FCP.
 * Uses the internal API proxy (Next.js rewrites /api → NestJS).
 */
export const getProduct = cache(async (slug: string) => {
  try {
    const res = await fetch(`${API_URL}/v1/products/${slug}`, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
})

/**
 * Server-side products list fetch — cached per request.
 */
export const getProducts = cache(async (params?: URLSearchParams) => {
  try {
    const search = params ? `?${params.toString()}` : ''
    const res = await fetch(`${API_URL}/v1/products${search}`, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!res.ok) return { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } }
    return res.json()
  } catch {
    return { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } }
  }
})