export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  address?: string
  role: 'customer' | 'admin'
  emailVerified: boolean
  createdAt: string
  updatedAt: string
}

export type AuthUser = Omit<User, 'createdAt' | 'updatedAt'>