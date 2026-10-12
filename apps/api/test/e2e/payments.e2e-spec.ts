import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from '../src/app.module'
import { PrismaService } from '../src/prisma/prisma.service'
import { Queue } from 'bullmq'
import * as crypto from 'crypto'

describe('Payments E2E (with mocked Paystack)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let mailQueue: Queue

  const PAYSTACK_SECRET_KEY = 'sk_test_mocksecretkey123456789'

  beforeAll(async () => {
    process.env.PAYSTACK_SECRET_KEY = PAYSTACK_SECRET_KEY
    process.env.FRONTEND_URL = 'http://localhost:3000'
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
    process.env.REDIS_URL = 'redis://localhost:6379'
    process.env.BETTER_AUTH_SECRET = 'test-secret'
    process.env.BETTER_AUTH_URL = 'http://localhost:3333'
    process.env.NODE_ENV = 'test'
    process.env.PORT = '3334'

    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile()
    app = moduleFixture.createNestApplication()
    await app.init()
    prisma = app.get(PrismaService)
    mailQueue = new Queue('mail', { connection: { url: process.env.REDIS_URL } })
  })

  afterAll(async () => { await app.close() })

  beforeEach(async () => {
    await prisma.client.orderItem.deleteMany()
    await prisma.client.stockReservation.deleteMany()
    await prisma.client.couponUse.deleteMany()
    await prisma.client.order.deleteMany()
    await prisma.client.cartItem.deleteMany()
    await prisma.client.cart.deleteMany()
    await prisma.client.product.deleteMany()
    await prisma.client.category.deleteMany()
    await prisma.client.user.deleteMany()
    await prisma.client.shippingZone.deleteMany()
    await prisma.client.coupon.deleteMany()
    await prisma.client.siteConfig.deleteMany()
  })

  function generateSignature(payload: object): string {
    return crypto.createHmac('sha512', PAYSTACK_SECRET_KEY).update(JSON.stringify(payload)).digest('hex')
  }

  async function setupOrderWithCart() {
    const user = await prisma.client.user.create({ data: { id: 'usr_test1', email: 'test@example.com', name: 'Test User', firstName: 'Test', lastName: 'User', role: 'customer' } })
    const category = await prisma.client.category.create({ data: { id: 'cat_test', name: 'Test Category', slug: 'test-category' } })
    const product = await prisma.client.product.create({ data: { id: 'prod_test1', name: 'Test Product', slug: 'test-product', description: 'Test', price: 50000, inStock: true, stock: 10, categoryId: category.id } })
    await prisma.client.cart.create({ data: { userId: user.id, items: { create: { productId: product.id, quantity: 1 } } } })
    await prisma.client.shippingZone.createMany({ data: [{ id: 'zone_nationwide', name: 'Nationwide', rate: 2000, active: true }, { id: 'zone_lagos', name: 'Lagos', rate: 1000, active: true }, { id: 'zone_international', name: 'International', rate: 15000, active: true }] })
    await prisma.client.siteConfig.create({ data: { id: 'singleton', vipOrderThreshold: 3, vipSpendThreshold: 200000 } })
    return { user, product }
  } 
describe('POST /v1/orders → POST /v1/payments/initialize → webhook → paid', () => {
    it('completes full order→pay→webhook→paid flow', async () => {
      const { user, product } = await setupOrderWithCart()

      const createOrderRes = await request(app.getHttpServer())
        .post('/v1/orders')
        .set('Cookie', [`session=test-session-${user.id}`])
        .send({ shippingAddress: { street: '123 Test St', city: 'Lagos', state: 'Lagos', country: 'Nigeria' } })
        .expect(201)

      const order = createOrderRes.body
      expect(order.status).toBe('pending')

      const initPaymentRes = await request(app.getHttpServer())
        .post('/v1/payments/initialize')
        .set('Cookie', [`session=test-session-${user.id}`])
        .send({ orderId: order.id })
        .expect(201)

      const { paystackData, email, amount } = initPaymentRes.body
      expect(paystackData).toHaveProperty('reference')
      expect(email).toBe(user.email)

      const reference = paystackData.reference
      const webhookPayload = { event: 'charge.success', data: { reference, metadata: { orderId: order.id }, status: 'success', amount: order.total * 100, currency: 'NGN', customer: { email: user.email } } }
      const signature = generateSignature(webhookPayload)

      await request(app.getHttpServer()).post('/v1/payments/webhook').set('x-paystack-signature', signature).send(webhookPayload).expect(200)

      const paidOrderRes = await request(app.getHttpServer()).get(`/v1/orders/${order.id}`).set('Cookie', [`session=test-session-${user.id}`]).expect(200)
      expect(paidOrderRes.body.status).toBe('paid')

      const updatedProduct = await prisma.client.product.findUnique({ where: { id: product.id } })
      expect(updatedProduct?.stock).toBe(9)
    })

    it('handles duplicate webhook idempotently', async () => {
      const { user, product } = await setupOrderWithCart()
      const createOrderRes = await request(app.getHttpServer()).post('/v1/orders').set('Cookie', [`session=test-session-${user.id}`]).send({ shippingAddress: { street: '123 Test St', city: 'Lagos', state: 'Lagos', country: 'Nigeria' } }).expect(201)
      const order = createOrderRes.body
      const initPaymentRes = await request(app.getHttpServer()).post('/v1/payments/initialize').set('Cookie', [`session=test-session-${user.id}`]).send({ orderId: order.id }).expect(201)
      const reference = initPaymentRes.body.paystackData.reference
      const webhookPayload = { event: 'charge.success', data: { reference, metadata: { orderId: order.id }, status: 'success', amount: order.total * 100, currency: 'NGN', customer: { email: user.email } } }
      const signature = generateSignature(webhookPayload)

      await request(app.getHttpServer()).post('/v1/payments/webhook').set('x-paystack-signature', signature).send(webhookPayload).expect(200)
      await request(app.getHttpServer()).post('/v1/payments/webhook').set('x-paystack-signature', signature).send(webhookPayload).expect(200)

      const paidOrderRes = await request(app.getHttpServer()).get(`/v1/orders/${order.id}`).set('Cookie', [`session=test-session-${user.id}`]).expect(200)
      expect(paidOrderRes.body.status).toBe('paid')
    })

    it('rejects webhook with invalid signature', async () => {
      const { user } = await setupOrderWithCart()
      const webhookPayload = { event: 'charge.success', data: { reference: 'ref_fake', metadata: { orderId: 'ord_fake' }, status: 'success' } }
      await request(app.getHttpServer()).post('/v1/payments/webhook').set('x-paystack-signature', 'invalid').send(webhookPayload).expect(403)
    })
  })

  describe('Coupon integration with payment flow', () => {
    it('applies coupon discount and tracks per-user limit', async () => {
      const { user, product } = await setupOrderWithCart()
      const coupon = await prisma.client.coupon.create({ data: { code: 'TEST10', type: 'percent', value: 10, scope: 'storewide', perUserLimit: 1, active: true } })

      const createOrderRes = await request(app.getHttpServer()).post('/v1/orders').set('Cookie', [`session=test-session-${user.id}`]).send({ shippingAddress: { street: '123 Test St', city: 'Lagos', state: 'Lagos', country: 'Nigeria' }, couponCode: 'TEST10' }).expect(201)
      const order = createOrderRes.body
      expect(order.discount).toBeGreaterThan(0)

      const initPaymentRes = await request(app.getHttpServer()).post('/v1/payments/initialize').set('Cookie', [`session=test-session-${user.id}`]).send({ orderId: order.id }).expect(201)
      const reference = initPaymentRes.body.paystackData.reference
      const webhookPayload = { event: 'charge.success', data: { reference, metadata: { orderId: order.id }, status: 'success', amount: order.total * 100, currency: 'NGN', customer: { email: user.email } } }
      const signature = generateSignature(webhookPayload)

      await request(app.getHttpServer()).post('/v1/payments/webhook').set('x-paystack-signature', signature).send(webhookPayload).expect(200)

      const couponUse = await prisma.client.couponUse.findFirst({ where: { couponId: coupon.id, userId: user.id } })
      expect(couponUse).toBeDefined()
      const updatedCoupon = await prisma.client.coupon.findUnique({ where: { id: coupon.id } })
      expect(updatedCoupon?.usedCount).toBe(1)
    })
  })
})
