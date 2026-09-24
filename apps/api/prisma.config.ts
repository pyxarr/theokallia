import { defineConfig } from 'prisma/config'

export default defineConfig({
  // path to the Prisma schema file — relative to this config file
  schema: './prisma/schema.prisma',

  // where migration files are stored and read from
  migrations: {
    path: './prisma/migrations',
  },

  // tells the Prisma CLI where to find the database URL for migrate commands
  // without this, `prisma migrate dev` throws "datasource.url is required"
  datasource: {
    url: process.env.DATABASE_URL!,
  },
})