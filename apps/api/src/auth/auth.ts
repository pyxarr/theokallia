import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { Queue } from 'bullmq'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  }),
})

// Mail queue — mirrors the BullMQ queue in MailModule
const mailQueue = new Queue('mail', {
  connection: {
    url: process.env.REDIS_URL,
    tls: {},
  },
})

// Subscribers queue — mirrors the BullMQ queue in SubscribersModule
const subscribersQueue = new Queue('subscribers', {
  connection: {
    url: process.env.REDIS_URL,
    tls: {},
  },
})

// Graceful shutdown for standalone clients (this file runs outside Nest DI)
const shutdown = async () => {
  await Promise.all([prisma.$disconnect(), mailQueue.close(), subscribersQueue.close()])
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [
    process.env.FRONTEND_URL ?? 'http://localhost:3000',
    process.env.ADMIN_URL ?? 'http://localhost:3002',
  ],

  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, url }) => {
      try {
        await mailQueue.add('send-reset-password', { email: user.email, firstName: user.name?.split(' ')[0] ?? 'there', url })
        console.log(`[Auth] Successfully queued reset password email for ${user.email}`)
      } catch (err) {
        console.error(`[Auth] Failed to queue reset password email for ${user.email}:`, err)
      }
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      try {
        await mailQueue.add('send-verification-email', { email: user.email, firstName: user.name?.split(' ')[0] ?? 'there', url })
        console.log(`[Auth] Successfully queued verification email for ${user.email}`)
      } catch (err) {
        console.error(`[Auth] Failed to queue verification email for ${user.email}:`, err)
      }
    },
  },

  user: {
    additionalFields: {
      firstName: {
        type: 'string',
        required: true,
        input: true,
      },
      lastName: {
        type: 'string',
        required: true,
        input: true,
      },
      phone: {
        type: 'string',
        required: false,
        input: true,
      },
      address: {
        type: 'string',
        required: false,
        input: true,
      },
      role: {
        type: 'string',
        required: true,
        defaultValue: 'customer',
        input: false, // never set by client
      },
    },
  },

  // Tag the newsletter subscriber record when a new account is created.
  // This file runs outside Nest DI, so it only enqueues the job — the
  // SubscribersProcessor performs the actual upsert and audience sync.
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            await subscribersQueue.add('tag-registered-subscriber', {
              userId: user.id,
              email: user.email,
            })
          } catch (err) {
            console.error(`[Auth] Failed to queue subscriber tagging for ${user.email}:`, err)
          }
        },
      },
    },
  },
})

export type Auth = typeof auth
