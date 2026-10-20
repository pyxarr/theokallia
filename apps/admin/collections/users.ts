import type { CollectionConfig } from 'payload'

import { isAdmin } from '../lib/access'
import { payloadAuthStrategy } from '../lib/payload-auth'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: { group: 'Content' },
  auth: {
    disableLocalStrategy: true,
    strategies: [payloadAuthStrategy],
  },
  // Creation is refused here because the strategy upserts user docs itself
  // under overrideAccess — no client-side path should exist.
  access: {
    create: () => false,
    delete: isAdmin,
    read: isAdmin,
    update: isAdmin,
  },
  fields: [
    { name: 'email', type: 'email', unique: true },
    { name: 'name', type: 'text' },
    { name: 'payloadAuthUserId', type: 'text', unique: true, index: true },
    { name: 'role', type: 'text' },
  ],
}
