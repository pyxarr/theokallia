import { Job } from 'bullmq'
import { SubscribersProcessor } from './subscribers.processor'
import { PrismaService } from '../prisma/prisma.service'
import { SubscribersService } from './subscribers.service'
import { ResendAudienceProvider } from './providers/resend-audience.provider'

/**
 * Unit tests for the subscriber background jobs.
 * The registration job only delegates; the sync job resolves the subscriber's
 * name and unsubscribe state before calling Resend.
 */
describe('SubscribersProcessor', () => {
  const subscriberDelegate = { findUnique: jest.fn() }
  const userDelegate = { findUnique: jest.fn() }
  const prisma = { client: { subscriber: subscriberDelegate, user: userDelegate } }
  const subscribersService = { tagRegistered: jest.fn() }
  const resendAudience = { upsertContact: jest.fn() }

  let processor: SubscribersProcessor

  beforeEach(() => {
    jest.resetAllMocks()
    processor = new SubscribersProcessor(
      prisma as unknown as PrismaService,
      subscribersService as unknown as SubscribersService,
      resendAudience as unknown as ResendAudienceProvider,
    )
  })

  it('delegates tag-registered-subscriber to the service', async () => {
    await processor.process({
      name: 'tag-registered-subscriber',
      data: { userId: 'usr_1', email: 'ada@example.com' },
    } as unknown as Job)

    expect(subscribersService.tagRegistered).toHaveBeenCalledWith('usr_1', 'ada@example.com')
  })

  it('syncs a subscriber contact with name and unsubscribe state', async () => {
    subscriberDelegate.findUnique.mockResolvedValueOnce({
      email: 'ada@example.com',
      userId: 'usr_1',
      active: true,
    })
    userDelegate.findUnique.mockResolvedValueOnce({
      id: 'usr_1',
      firstName: 'Ada',
      lastName: 'Lovelace',
    })

    await processor.process({
      name: 'sync-resend-contact',
      data: { email: 'ada@example.com' },
    } as unknown as Job)

    expect(resendAudience.upsertContact).toHaveBeenCalledWith({
      email: 'ada@example.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
      unsubscribed: false,
    })
  })

  it('skips syncing when the subscriber no longer exists', async () => {
    subscriberDelegate.findUnique.mockResolvedValueOnce(null)

    await processor.process({
      name: 'sync-resend-contact',
      data: { email: 'gone@example.com' },
    } as unknown as Job)

    expect(resendAudience.upsertContact).not.toHaveBeenCalled()
  })
})
