import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'

import { Banners } from './collections/banners'
import { Promotions } from './collections/promotions'
import { Users } from './collections/users'
import { About } from './globals/about'
import { Hero } from './globals/hero'

const payloadSecret = process.env.PAYLOAD_SECRET
const payloadDatabaseUrl = process.env.PAYLOAD_DATABASE_URL

if (!payloadSecret) {
  throw new Error('PAYLOAD_SECRET is not set')
}
if (!payloadDatabaseUrl) {
  throw new Error('PAYLOAD_DATABASE_URL is not set')
}

// eslint-disable-next-line @typescript-eslint/naming-convention
const __filename = fileURLToPath(import.meta.url)
// eslint-disable-next-line @typescript-eslint/naming-convention
const __dirname = dirname(__filename)

export default buildConfig({
  admin: {
    user: 'users',
    importMap: {
      baseDir: resolve(__dirname, 'app/studio'),
      importMapFile: resolve(__dirname, 'app/studio/importMap.js'),
    },
  },
  // /studio-api keeps Payload's REST off the dashboard's existing /api proxy.
  routes: {
    admin: '/studio',
    api: '/studio-api',
  },
  collections: [Users, Banners, Promotions],
  globals: [Hero, About],
  editor: lexicalEditor(),
  secret: payloadSecret,
  typescript: {
    outputFile: resolve(__dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: payloadDatabaseUrl,
    },
  }),
})
