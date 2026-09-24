import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateOrderDto } from './dto/create-order.dto'
import { Order, Product, Asset } from '@prisma/client'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import { resolveShippingZone } from './shipping-zone-mapping.config'
import { CouponsService } from '../coupons/coupons.service'
import {
  AdminOrdersFilterDto,
  UpdateOrderStatusDto,
} from './dto/admin-orders.dto'
import { validateStatusTransition } from './order-transitions.config'

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('orders') private ordersQueue: Queue,
    @InjectQueue('mail') private mailQueue: Queue,
    private couponsService: CouponsService,
  ) {}

  async createOrder(userId: string, dto: CreateOrderDto): Promise<Order> {
    const cart = await this.prisma.client.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } },
    })

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException(
        'Cart is empty. Please add items to your cart before ordering.',
      )
    }

    // Resolve which shipping zone applies based on the delivery address
    const zoneName = resolveShippingZone(dto.shippingAddress)

    // Fetch the zone record to get the rate — zone must exist in the database
    const shippingZone = await this.prisma.client.shippingZone.findUnique({
      where: { name: zoneName },
    })

    if (!shippingZone) {
      throw new BadRequestException(
        `Shipping zone "${zoneName}" is not currently available. Please contact support.`,
      )
    }

    if (!shippingZone.active) {
      throw new BadRequestException(
        `Shipping to this location is currently unavailable. Please contact support.`,
      )
    }

    const shippingFee = shippingZone.rate

    // Coupon pre-validation outside the transaction — it only fails fast and
    // seeds couponId; the discount is re-validated authoritatively inside the
    // transaction (transactionDiscount) before totals are computed.
    let couponId: string | null = null

    if (dto.couponCode) {
      const subtotal = cart.items.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0,
      )

      const cartItems = cart.items.map((item) => ({
        productId: item.product.id,
        categoryId: item.product.categoryId,
        price: item.product.price,
        quantity: item.quantity,
      }))

      const couponResult = await this.couponsService.validateCoupon(
        { code: dto.couponCode, subtotal, items: cartItems },
        userId,
      )

      couponId = couponResult.couponId
    }

    return this.prisma.client.$transaction(async (tx) => {
      let subtotal = 0
      const orderItemsData: {
        productId: string
        quantity: number
        price: number
      }[] = []
      const reservationsData: {
        productId: string
        quantity: number
        expiresAt: Date
      }[] = []

      // Batch fetch active reservations for all products in cart — avoids N+1
      const productIds = cart.items.map((item) => item.product.id)
      const now = new Date()
      const activeReservations = await tx.stockReservation.groupBy({
        by: ['productId'],
        where: {
          productId: { in: productIds },
          expiresAt: { gt: now },
        },
        _sum: { quantity: true },
      })

      const reservedMap = new Map(
        activeReservations.map((r) => [r.productId, r._sum.quantity ?? 0]),
      )

      for (const item of cart.items) {
        const product = item.product

        const reservedQuantity = reservedMap.get(product.id) ?? 0
        const availableStock = product.stock - reservedQuantity

        if (availableStock < item.quantity) {
          throw new BadRequestException(
            `${product.name} has insufficient stock (available: ${availableStock})`,
          )
        }

        subtotal += product.price * item.quantity

        orderItemsData.push({
          productId: product.id,
          quantity: item.quantity,
          price: product.price,
        })

        reservationsData.push({
          productId: product.id,
          quantity: item.quantity,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        })
      }

      // Authoritative coupon re-validation inside transaction — never trust pre-flight result
      let transactionDiscount = 0
      let transactionCouponId: string | null = couponId

      if (dto.couponCode && couponId) {
        const cartItemsForValidation = cart.items.map((item) => ({
          productId: item.product.id,
          categoryId: item.product.categoryId,
          price: item.product.price,
          quantity: item.quantity,
        }))

        const revalidated = await this.couponsService.validateCoupon(
          { code: dto.couponCode, subtotal, items: cartItemsForValidation },
          userId,
        )

        if (revalidated.type === 'free_shipping') {
          transactionDiscount = shippingFee
        } else {
          transactionDiscount = revalidated.discount
        }

        transactionCouponId = revalidated.couponId
      }

      const total = Math.max(0, subtotal - transactionDiscount + shippingFee)

      const order = await tx.order.create({
        data: {
          userId,
          total,
          discount: transactionDiscount,
          shippingFee,
          shippingAddress: {
            street: dto.shippingAddress.street,
            city: dto.shippingAddress.city,
            state: dto.shippingAddress.state,
            country: dto.shippingAddress.country,
          },
          shippingZoneId: shippingZone.id,
          couponId: transactionCouponId,
          status: 'pending',
          items: {
            create: orderItemsData,
          },
          reservations: {
            create: reservationsData,
          },
        },
        include: { items: true },
      })

      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      })

      // Record coupon usage and increment usedCount atomically inside the transaction
      if (transactionCouponId) {
        await tx.couponUse.create({
          data: {
            couponId: transactionCouponId,
            userId,
            orderId: order.id,
          },
        })

        await tx.coupon.update({
          where: { id: transactionCouponId },
          data: { usedCount: { increment: 1 } },
        })
      }

      await this.ordersQueue.add(
        'cleanup-reservation',
        { orderId: order.id },
        { delay: 30 * 60 * 1000 },
      )

      return order
    })
  }

  async getUserOrders(userId: string) {
    const orders = await this.prisma.client.order.findMany({
      where: { userId },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    })

    const productIds = [
      ...new Set(orders.flatMap((o) => o.items.map((i) => i.productId))),
    ]
    if (productIds.length > 0) {
      const assets = await this.prisma.client.asset.findMany({
        where: { entityType: 'Product', entityId: { in: productIds } },
        orderBy: { sortOrder: 'asc' },
      })
      const assetMap = new Map<string, typeof assets>()
      for (const asset of assets) {
        const group = assetMap.get(asset.entityId) ?? []
        group.push(asset)
        assetMap.set(asset.entityId, group)
      }
      return orders.map((order) => ({
        ...order,
        items: order.items.map((item) => ({
          ...item,
          product: {
            ...item.product,
            assets: assetMap.get(item.productId) ?? [],
          },
        })),
      }))
    }

    return orders
  }

  async getOrderById(userId: string, orderId: string) {
    const order = await this.prisma.client.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } } },
    })

    if (!order) {
      throw new NotFoundException('Order not found')
    }

    if (order.userId !== userId) {
      throw new ForbiddenException('You are not authorized to view this order')
    }

    const productIds = [...new Set(order.items.map((i) => i.productId))]
    if (productIds.length > 0) {
      const assets = await this.prisma.client.asset.findMany({
        where: { entityType: 'Product', entityId: { in: productIds } },
        orderBy: { sortOrder: 'asc' },
      })
      const assetMap = new Map<string, typeof assets>()
      for (const asset of assets) {
        const group = assetMap.get(asset.entityId) ?? []
        group.push(asset)
        assetMap.set(asset.entityId, group)
      }
      return {
        ...order,
        items: order.items.map((item) => ({
          ...item,
          product: {
            ...item.product,
            assets: assetMap.get(item.productId) ?? [],
          },
        })),
      }
    }

    return order
  }

  async markAsPaid(orderId: string) {
    const paidOrder = await this.prisma.client.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { reservations: true },
      })

      if (!order) {
        throw new NotFoundException('Order not found')
      }

      for (const res of order.reservations) {
        await tx.product.update({
          where: { id: res.productId },
          data: { stock: { decrement: res.quantity } },
        })
      }

      await tx.stockReservation.deleteMany({
        where: { orderId },
      })

      return tx.order.update({
        where: { id: orderId },
        data: { status: 'paid' },
      })
    })

    // §7.1 — VIP qualification is evaluated after the paid order is committed.
    // Enqueue a job so it runs asynchronously with retry semantics.
    await this.ordersQueue.add('evaluate-vip', { userId: paidOrder.userId })

    return paidOrder
  }

  /**
   * Promotes a customer to VIP once they cross either SiteConfig threshold
   * (order count or lifetime spend), then alerts the business and tags their
   * subscriber record. No-op when SiteConfig is missing or the customer is
   * already VIP, so repeated payments never double-fire side effects.
   */
  async evaluateVip(userId: string) {
    const config = await this.prisma.client.siteConfig.findFirst()

    if (!config) {
      return
    }

    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
    })

    if (!user || user.isVip) {
      return
    }

    const orderAgg = await this.prisma.client.order.aggregate({
      where: { userId, status: { in: ['paid', 'shipped', 'delivered'] } },
      _count: { _all: true },
      _sum: { total: true },
    })

    const totalOrders = orderAgg._count._all
    const totalSpend = orderAgg._sum.total ?? 0

    const qualifies =
      totalOrders >= config.vipOrderThreshold ||
      totalSpend >= config.vipSpendThreshold

    if (!qualifies) {
      return
    }

    const vipSince = new Date()

    await this.prisma.client.user.update({
      where: { id: userId },
      data: { isVip: true, vipSince },
    })

    // §7.2 Side Effect A — alert the business. Payload mirrors VipNotificationEmailProps
    await this.mailQueue.add('send-vip-notification', {
      customerName: [user.firstName, user.lastName].filter(Boolean).join(' '),
      customerEmail: user.email,
      totalOrders,
      totalSpend,
      dateAchieved: vipSince.toISOString(),
    })

    // §7.2 Side Effect B — tag the subscriber record
    await this.tagVipSubscriber(user.email, user.id)
  }

  /**
   * Adds the "vip" tag to a customer's subscriber record, creating the record
   * if the customer has never subscribed. Existing tags are preserved.
   */
  private async tagVipSubscriber(email: string, userId: string) {
    await this.prisma.client.subscriber.upsert({
      where: { email },
      create: { email, userId, tags: ['registered', 'vip'], active: true },
      update: {
        userId,
        tags: {
          push: 'vip',
        },
      },
    })
  }

  /**
   * Admin-only order list with status filtering and pagination.
   */
  async getAllOrdersAdmin(filters: AdminOrdersFilterDto) {
    const { status, page = 1, limit = 20 } = filters
    const skip = (page - 1) * limit
    const where = status ? { status } : {}

    const [orders, total] = await Promise.all([
      this.prisma.client.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          items: { include: { product: true } },
          shippingZone: true,
        },
      }),
      this.prisma.client.order.count({ where }),
    ])

    const data = await this.attachProductAssets(orders)

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  /**
   * Attaches polymorphic Product assets to each order item so admin tables can
   * render thumbnails — mirrors the customer-facing order serializers, since
   * Asset rows are polymorphic (entityType/entityId) and cannot be included
   * through the Product relation.
   */
  private async attachProductAssets<
    T extends { items: { productId: string; product: Product }[] },
  >(orders: T[]) {
    const productIds = [
      ...new Set(
        orders.flatMap((order) => order.items.map((item) => item.productId)),
      ),
    ]

    const assets = await this.prisma.client.asset.findMany({
      where: { entityType: 'Product', entityId: { in: productIds } },
      orderBy: { sortOrder: 'asc' },
    })

    const assetMap = new Map<string, Asset[]>()
    for (const asset of assets) {
      const group = assetMap.get(asset.entityId) ?? []
      group.push(asset)
      assetMap.set(asset.entityId, group)
    }

    return orders.map((order) => ({
      ...order,
      items: order.items.map((item) => ({
        ...item,
        product: {
          ...item.product,
          assets: assetMap.get(item.productId) ?? [],
        },
      })),
    }))
  }

  /**
   * Aggregate counts powering the admin dashboard overview cards.
   */
  async getAdminMetrics() {
    const [revenueAgg, activeOrders, pendingReviews, subscribers] =
      await Promise.all([
        this.prisma.client.order.aggregate({
          _sum: { total: true },
          where: { status: { in: ['paid', 'shipped', 'delivered'] } },
        }),
        this.prisma.client.order.count({
          where: { status: { in: ['pending', 'paid', 'shipped'] } },
        }),
        this.prisma.client.review.count({ where: { status: 'pending' } }),
        this.prisma.client.subscriber.count({ where: { active: true } }),
      ])

    return {
      revenue: revenueAgg._sum.total ?? 0,
      activeOrders,
      pendingReviews,
      subscribers,
    }
  }

  /**
   * Admin-only order detail — no ownership check.
   */
  async getOrderByIdAdmin(orderId: string) {
    const order = await this.prisma.client.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true, phone: true },
        },
        items: { include: { product: true } },
        shippingZone: true,
        coupon: true,
      },
    })

    if (!order) {
      throw new NotFoundException('Order not found')
    }

    const [withAssets] = await this.attachProductAssets([order])
    return withAssets
  }

  /**
   * Updates order status with transition validation. When the new status is
   * 'shipped', requires a tracking number and enqueues a shipping email.
   */
  async updateOrderStatus(orderId: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.client.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    })

    if (!order) {
      throw new NotFoundException('Order not found')
    }

    validateStatusTransition(order.status, dto.status)

    if (dto.status === 'shipped' && !dto.trackingNumber) {
      throw new BadRequestException(
        'Tracking number is required when marking an order as shipped.',
      )
    }

    const updated = await this.prisma.client.order.update({
      where: { id: orderId },
      data: {
        status: dto.status,
        ...(dto.trackingNumber !== undefined && {
          trackingNumber: dto.trackingNumber,
        }),
      },
    })

    if (dto.status === 'shipped') {
      await this.mailQueue.add('send-shipping-update', {
        email: order.user?.email,
        firstName: order.user?.firstName,
        orderId: order.id,
        trackingNumber: dto.trackingNumber,
      })
    }

    return updated
  }
}
