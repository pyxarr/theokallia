import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { OrdersProcessor } from './orders.processor'
import { PrismaService } from '../prisma/prisma.service'
import { OrdersService } from './orders.service'
import { CouponsService } from '../coupons/coupons.service'

/**
 * Unit tests for the orders queue jobs.
 * The 'evaluate-vip' job is what promotes a customer to VIP after a paid
 * order — without a consumer for it the promotion never happened.
 */
describe('OrdersProcessor', () => {
  const prisma = { client: {} }
  const ordersService = { evaluateVip: jest.fn() }
  const couponsService = {}

  let processor: OrdersProcessor
  let warn: jest.SpyInstance

  beforeEach(() => {
    jest.resetAllMocks()
    processor = new OrdersProcessor(
      prisma as unknown as PrismaService,
      ordersService as unknown as OrdersService,
      couponsService as unknown as CouponsService,
    )
    warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined)
  })

  afterEach(() => {
    warn.mockRestore()
  })

  it('evaluates the VIP status of the customer who paid', async () => {
    await processor.process({
      name: 'evaluate-vip',
      data: { userId: 'usr_1' },
    } as unknown as Job)

    expect(ordersService.evaluateVip).toHaveBeenCalledWith('usr_1')
    expect(warn).not.toHaveBeenCalled()
  })
})
