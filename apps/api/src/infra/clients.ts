/**
 * Shared Prisma client — a single connection pool used by both NestJS DI
 * (services, modules) and standalone configs (Better Auth).
 */
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

// Shared Prisma adapter + client (single connection pool)
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
export const prisma = new PrismaClient({ adapter })
export type { PrismaClient }