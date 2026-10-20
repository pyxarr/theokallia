import type { CollectionConfig } from 'payload'

import { adminOnly } from '../lib/access'

export const Promotions: CollectionConfig = {
  slug: 'promotions',
  admin: { group: 'Content' },
  access: adminOnly,

  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'ctaText', type: 'text' },
    { name: 'ctaLink', type: 'text' },
    { name: 'active', type: 'checkbox', defaultValue: true },
  ],
}
