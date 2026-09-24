'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

/**
 * The API's Better Auth config adds firstName/lastName/phone/address/role as
 * additional user fields, but the generic client type only knows the base
 * fields — so the session user is narrowed here.
 */
interface AdminSessionUser {
  id: string
  email: string
  name?: string
  role: 'customer' | 'admin'
}

/**
 * Gates every dashboard page. Redirects to /login when there is no session and
 * to /unauthorized when the signed-in user is not an admin. Renders nothing
 * while the session resolves so protected content never flashes.
 */
export default function AdminGuard({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()

  const user = session?.user as AdminSessionUser | undefined
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    if (isPending) return
    if (!user) {
      router.replace('/login')
    } else if (!isAdmin) {
      router.replace('/unauthorized')
    }
  }, [isPending, user, isAdmin, router])

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Checking access…</p>
      </div>
    )
  }

  if (!user || !isAdmin) return null

  return <>{children}</>
}
