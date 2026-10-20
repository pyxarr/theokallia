import type { GlobalConfig } from 'payload'

import { isAdmin } from '../lib/access'

export const Hero: GlobalConfig = {
  slug: 'hero',
  admin: { group: 'Content' },
  access: {
    read: isAdmin,
    update: isAdmin,
  },
  fields: [
    { name: 'heading', type: 'text', required: true },
    { name: 'subheading', type: 'text' },
    { name: 'ctaText', type: 'text' },
    { name: 'ctaLink', type: 'text' },
  ],
}

