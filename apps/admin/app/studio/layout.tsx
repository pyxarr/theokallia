import config from '@payload-config'
import '@payloadcms/next/css'
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import type { ServerFunctionClient } from 'payload'

import { runWithAuth } from '@/lib/auth-context'
import { getAuthUser } from '@/lib/payload-auth'

import { importMap } from './importMap'

const serverFunction: ServerFunctionClient = async (args) => {
  'use server'
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  })
}

type Args = {
  children: React.ReactNode
}

// Payload ships its own login view, but the only credentials that exist are
// Better Auth's — so an unauthenticated visitor goes to /login instead.
const Layout = async ({ children }: Args) => {
  const requestHeaders = await headers()
  const user = await getAuthUser(requestHeaders)
  if (!user) {
    redirect('/login?next=/studio')
  }

  return (
    <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
      {runWithAuth(user, () => children)}
    </RootLayout>
  )
}

export default Layout
