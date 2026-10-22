import { Queue } from 'bullmq'
import { PrismaService } from '../prisma/prisma.service'

/**
 * Emails the shared welcome coupon to a customer who has just signed up.
 *
 * The welcome offer is one ordinary coupon row marked `source: 'welcome'`
 * and `autoIssue: true` — not a per-customer code — so the same code is
 * emailed to every new customer.
 *
 * Built by hand (not by Nest DI) because the only caller is the signup
 * hook in `auth.ts`, which runs outside the Nest container.
 */
export class WelcomeCouponService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailQueue: Queue,
  ) {}

  /**
   * Finds the welcome coupon and enqueues its email. Never throws: the
   * user row already exists by the time this runs, so a failure here must
   * not fail the signup — the customer would get a 500 and then "email
   * already registered" when they retried.
   */
  async issueTo(user: {
    id: string
    email: string
    name?: string | null
  }): Promise<void> {
    try {
      const coupon = await this.prisma.client.coupon.findFirst({
        where: {
          source: 'welcome',
          autoIssue: true,
          active: true,
          AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }],
        },
        // Deterministic pick: if two welcome coupons ever exist, the
        // oldest one is always the one sent.
        orderBy: { createdAt: 'asc' },
      })

      if (!coupon) return

      // maxUses and usedCount are two columns, so the budget cannot be
      // checked in the query. A spent coupon would email a code the
      // customer cannot redeem.
      if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) return

      await this.mailQueue.add('send-welcome-coupon', {
        email: user.email,
        firstName: user.name?.split(' ')[0] ?? 'there',
        code: coupon.code,
        discountLabel: this.discountLabel(coupon.type, coupon.value),
        minOrder: coupon.minOrder ?? 0,
        expiresAt: coupon.expiresAt?.toISOString() ?? null,
      })
    } catch (err) {
      console.error('[Auth] Failed to issue the welcome coupon:', err)
    }
  }

  /** The welcome coupon can be a percentage, a fixed amount or free shipping. */
  private discountLabel(type: string, value: number): string {
    if (type === 'percent') return `${value}% off`
    if (type === 'fixed') return `₦${value.toLocaleString('en-NG')} off`
    return 'free shipping'
  }
}
