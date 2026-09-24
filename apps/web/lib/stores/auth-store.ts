import { create } from 'zustand'

export interface AuthSessionUser {
  id: string
  email: string
  emailVerified: boolean
  firstName: string
  lastName: string
  phone?: string
  address?: string
  role: 'customer' | 'admin'
  name?: string
  image?: string | null
}

interface AuthState {
  // The currently logged-in user — null if not logged in
  user: AuthSessionUser | null
  // Whether we're still checking if a session exists on app load
  isLoading: boolean
  // Whether the user is logged in
  isAuthenticated: boolean
  redirectTo: string | null
  authModalOpen: boolean
  authModalView: 'login' | 'sign-up' | 'verified' | 'reset-password'
  resetToken: string | null
  // Actions
  setUser: (user: AuthSessionUser | null) => void
  setLoading: (loading: boolean) => void
  setRedirectTo: (path: string | null) => void
  setResetToken: (token: string | null) => void
  openAuthModal: (view?: 'login' | 'sign-up' | 'verified' | 'reset-password') => void
  closeAuthModal: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  redirectTo: null,
  authModalOpen: false,
  authModalView: 'login',
  resetToken: null,
  setUser: (user) => set({ user, isAuthenticated: user !== null }),
  setLoading: (loading) => set({ isLoading: loading }),
  setRedirectTo: (path) => set({ redirectTo: path }),
  setResetToken: (token) => set({ resetToken: token }),
  openAuthModal: (view = 'login') => set({ authModalOpen: true, authModalView: view }),
  closeAuthModal: () => set({ authModalOpen: false, resetToken: null }),
}))
