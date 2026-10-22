import { Queue } from 'bullmq'
import { WelcomeCouponService } from './welcome-coupon.service'
import { PrismaService } from '../prisma/prisma.service'

/**
 * Unit tests for the welcome coupon issued when a customer signs up.
 *
 * The whole path runs after the user row is created, so a coupon that
 * cannot be issued must never fail the signup — the customer would get
 * a 500 and then "email already registered" on the retry.
 */
describe('WelcomeCouponService', () => {
  const couponDelegate = { findFirst: jest.fn() }
  const prisma = { client: { coupon: couponDelegate } }
  const mailQueue = { add: jest.fn() }
  let service: WelcomeCouponService

  const welcomeCoupon = (overrides: Record<string, unknown> = {}) => ({
    id: 'cpn_1',
    code: 'WELCOME10',
    type: 'percent',
    value: 10,
    minOrder: 20000,
    maxUses: null,
    usedCount: 0,
    expiresAt: null,
    active: true,
    source: 'welcome',
    autoIssue: true,
    ...overrides,
  })

  const user = { id: 'usr_1', email: 'ada@example.com', name: 'Ada Lovelace' }

  beforeEach(() => {
    jest.resetAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => undefined)
    service = new WelcomeCouponService(
      prisma as unknown as PrismaService,
      mailQueue as unknown as Queue,
    )
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('enqueues the coupon code when a welcome coupon exists', async () => {
    couponDelegate.findFirst.mockResolvedValueOnce(welcomeCoupon())

    await service.issueTo(user)

    expect(mailQueue.add).toHaveBeenCalledWith('send-welcome-coupon', {
      email: 'ada@example.com',
      firstName: 'Ada',
      code: 'WELCOME10',
      discountLabel: '10% off',
      minOrder: 20000,
      expiresAt: null,
    })
  })

  it('does nothing when there is no welcome coupon', async () => {
    couponDelegate.findFirst.mockResolvedValueOnce(null)

    await service.issueTo(user)

    expect(mailQueue.add).not.toHaveBeenCalled()
  })

  it('does nothing when the welcome coupon is inactive', async () => {
    couponDelegate.findFirst.mockResolvedValueOnce(null)

    await service.issueTo(user)

    const { where } = couponDelegate.findFirst.mock.calls[0][0]
    expect(where.active).toBe(true)
    expect(mailQueue.add).not.toHaveBeenCalled()
  })

  it('does nothing when the welcome coupon has expired', async () => {
    couponDelegate.findFirst.mockResolvedValueOnce(null)

    await service.issueTo(user)

    const { where } = couponDelegate.findFirst.mock.calls[0][0]
    expect(where.AND[0].OR).toEqual([
      { expiresAt: null },
      { expiresAt: { gt: expect.any(Date) } },
    ])
    expect(mailQueue.add).not.toHaveBeenCalled()
  })

  it('does nothing when the welcome coupon budget is spent', async () => {
    couponDelegate.findFirst.mockResolvedValueOnce(
      welcomeCoupon({ maxUses: 100, usedCount: 100 }),
    )

    await service.issueTo(user)

    // A spent coupon would email a code the customer cannot redeem.
    expect(mailQueue.add).not.toHaveBeenCalled()
  })

  it('labels a fixed-amount coupon correctly', async () => {
    couponDelegate.findFirst.mockResolvedValueOnce(
      welcomeCoupon({ type: 'fixed', value: 5000 }),
    )

    await service.issueTo(user)

    expect(mailQueue.add).toHaveBeenCalledWith(
      'send-welcome-coupon',
      expect.objectContaining({ discountLabel: '₦5,000 off' }),
    )
  })

  it('labels a free-shipping coupon correctly', async () => {
    couponDelegate.findFirst.mockResolvedValueOnce(
      welcomeCoupon({ type: 'free_shipping', value: 0 }),
    )

    await service.issueTo(user)

    expect(mailQueue.add).toHaveBeenCalledWith(
      'send-welcome-coupon',
      expect.objectContaining({ discountLabel: 'free shipping' }),
    )
  })

  it('never throws when the coupon lookup fails', async () => {
    couponDelegate.findFirst.mockRejectedValueOnce(new Error('database down'))

    // The user row already exists by the time this runs — a throw here
    // would fail the signup and strand the customer.
    await expect(service.issueTo(user)).resolves.toBeUndefined()
    expect(mailQueue.add).not.toHaveBeenCalled()
  })

  it('picks the oldest welcome coupon deterministically', async () => {
    couponDelegate.findFirst.mockResolvedValueOnce(welcomeCoupon())

    await service.issueTo(user)

    const query = couponDelegate.findFirst.mock.calls[0][0]
    expect(query.where).toEqual(
      expect.objectContaining({ source: 'welcome', autoIssue: true, active: true }),
    )
    expect(query.orderBy).toEqual({ createdAt: 'asc' })
  })
})
