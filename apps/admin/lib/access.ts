import type { Access } from 'payload'

/**
 * The single gate for `/studio` and every Payload collection. Narrow-cast
 * because `role` is a Better Auth additionalField, not part of Payload's
 * generic user shape until `payload-types.ts` is generated.
 */
export const isAdmin: Access = ({ req }) =>
  (req?.user as { role?: string } | null)?.role === 'admin'

export const adminOnly = {
  create: isAdmin,
  delete: isAdmin,
  read: isAdmin,
  update: isAdmin,
}
