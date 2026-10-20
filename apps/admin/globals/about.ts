import type { GlobalConfig } from 'payload'

import { isAdmin } from '../lib/access'

export const About: GlobalConfig = {
  slug: 'about',
  admin: { group: 'Content' },
  access: {
    read: isAdmin,
    update: isAdmin,
  },
  fields: [
    { name: 'heading', type: 'text', required: true },
    { name: 'body', type: 'richText' },
  ],
}

