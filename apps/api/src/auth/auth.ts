import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from '../infra/clients'
import { mailQueue, subscribersQueue, shutdown } from '../infra/queues'
import { PrismaService } from '../prisma/prisma.service'
import { WelcomeCouponService } from '../coupons/welcome-coupon.service'

// auth.ts is created outside Nest DI, so the welcome coupon service is
// built by hand. PrismaService is the thin wrapper around the shared
// prisma client, so this uses the same connection pool as everything else.
const welcomeCouponService = new WelcomeCouponService(new PrismaService(), mailQueue)

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
          // The welcome coupon must never fail the signup: the user row
          // already exists by the time this hook runs, so a customer who
          // got a 500 would be told their email is already registered.
          try {
            await welcomeCouponService.issueTo({
              id: user.id,
              email: user.email,
              name: user.name,
            })
          } catch (err) {
            console.error('[Auth] Failed to issue the welcome coupon:', err)
          }
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
