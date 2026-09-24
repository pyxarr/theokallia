import { createAuthClient } from 'better-auth/react'
import { env } from '@/lib/env'

// Better Auth needs an absolute URL at module load time.
const baseURL = `${env.NEXT_PUBLIC_APP_URL}/api/auth`

export const authClient = createAuthClient({
  baseURL,
})
