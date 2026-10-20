import { AsyncLocalStorage } from 'async_hooks'

type PayloadAuthSessionUser = {
  id?: string
  name?: string | null
  email?: string
  role?: string
}

type AuthStore = {
  user: PayloadAuthSessionUser | null
}

const storage = new AsyncLocalStorage<AuthStore>()

export const getAuthStore = (): AuthStore | undefined => storage.getStore()

export const runWithAuth = <T>(user: PayloadAuthSessionUser | null, fn: () => T): T => {
  return storage.run({ user }, fn)
}
