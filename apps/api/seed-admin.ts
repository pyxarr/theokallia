import { randomUUID } from 'node:crypto'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { hashPassword } from 'better-auth/crypto'
import 'dotenv/config'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

const prisma = new PrismaClient({ adapter })

// CLI: `pnpm seed:admin -- <email> [name] [password]`
// Defaults keep the command repeatable without secrets. Passing a password
// also provisions the credential Account row so the account can actually
// sign in — the default flow only writes a role='admin' user row.
// pnpm forwards a literal `--` separator as argv[2] on some versions, so it
// is filtered out before positional parsing.
const args = process.argv.slice(2).filter((arg) => arg !== '--')
const emailArg = args[0]
const nameArg = args[1]
const passwordArg = args[2]

const EMAIL = (emailArg ?? process.env.SEED_ADMIN_EMAIL ?? '').trim().toLowerCase()
const NAME = (nameArg ?? process.env.SEED_ADMIN_NAME ?? 'Admin').trim()
const PASSWORD = passwordArg?.trim() ?? process.env.SEED_ADMIN_PASSWORD?.trim()

if (!EMAIL) {
  throw new Error('SEED_ADMIN_EMAIL environment variable is required (or pass email as first argument).')
}

/**
 * Promotes an account to admin (role='admin'), creating the user row when the
 * email does not exist yet.
 *
 * With a password argument, this also creates (or replaces) the Better Auth
 * credential Account row — hashed with better-auth/crypto so sign-in verifies
 * it — and marks the user emailVerified, since auth.ts sets
 * requireEmailVerification: true. Without a password, only the user row is
 * written and the account cannot sign in (normal sign-up links the credential
 * account at registration time, which this script skips).
 */
async function main() {
  console.log(`\nPromoting ${EMAIL} to admin...`)

  if (PASSWORD && PASSWORD.length < 8) {
    throw new Error(
      'Password must be at least 8 characters (auth.ts minPasswordLength).',
    )
  }

  const [firstName, ...rest] = NAME.split(/\s+/)
  const lastName = rest.join(' ') || firstName

  const user = await prisma.user.upsert({
    where: { email: EMAIL },
    update: {
      role: 'admin',
      name: NAME,
      ...(PASSWORD ? { emailVerified: true } : {}),
    },
    create: {
      id: `seed-admin-${Date.now()}`,
      name: NAME,
      email: EMAIL,
      emailVerified: !!PASSWORD,
      firstName,
      lastName,
      role: 'admin',
    },
  })

  console.log(`- id:            ${user.id}`)
  console.log(`- role:          ${user.role}`)
  console.log(`- emailVerified: ${user.emailVerified}`)

  if (PASSWORD) {
    const hash = await hashPassword(PASSWORD)

    const existing = await prisma.account.findFirst({
      where: { userId: user.id, providerId: 'credential' },
    })

    if (existing) {
      await prisma.account.update({
        where: { id: existing.id },
        data: { password: hash },
      })
      console.log('- credential:    password replaced on existing account')
    } else {
      // Field conventions mirror Better Auth's sign-up linkAccount call:
      // providerId 'credential', accountId = user.id, password = hash.
      await prisma.account.create({
        data: {
          id: randomUUID(),
          accountId: user.id,
          providerId: 'credential',
          userId: user.id,
          password: hash,
        },
      })
      console.log(
        '- credential:    created (providerId=credential, accountId=user.id)',
      )
    }
  }

  console.log(
    PASSWORD
      ? `\nDone. ${EMAIL} can now sign in at http://localhost:3002/login.`
      : `\nDone (user row only — no password). To make it signable run:\n  pnpm --filter @theokallia/api seed:admin -- ${EMAIL} "${NAME}" "<password>"`,
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
