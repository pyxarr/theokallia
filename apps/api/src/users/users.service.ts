import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { UpdateUserDto } from './dto/update-user.dto'
import { AdminCustomersFilterDto } from './dto/admin-users.dto'

/**
 * Order statuses that count towards a customer's lifetime value.
 * Mirrors OrdersService.evaluateVip() so the spend shown in the admin matches
 * the number that actually drives VIP qualification.
 */
const QUALIFYING_ORDER_STATUSES = ['paid', 'shipped', 'delivered']

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // Find a user by their database ID
  async findById(userId: string) {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new NotFoundException('User not found')
    }

    return user
  }

  // Find a user by email (safe fields only)
  async findByEmail(email: string) {
    return this.prisma.client.user.findUnique({
      where: { email },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        role: true,
        isVip: true,
        vipSince: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  }

  // Check whether the account tied to this email has already been verified.
  async isEmailVerified(email: string) {
    const user = await this.findByEmail(email)

    return {
      verified: user?.emailVerified ?? false,
    }
  }

  // Update the current user's profile
  // Only fields provided in the DTO will be updated
  async updateMe(userId: string, dto: UpdateUserDto) {
    const allowedFields = {
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      address: dto.address,
    }

    const user = await this.prisma.client.user.update({
      where: { id: userId },
      data: allowedFields,
    })

    return user
  }

  // Manually set a customer's VIP status (admin only).
  // Turning VIP on stamps vipSince; turning it off clears the flag but
  // keeps vipSince as a record of when they qualified.
  async setVip(userId: string, isVip: boolean) {
    await this.findById(userId)

    const user = await this.prisma.client.user.update({
      where: { id: userId },
      data: {
        isVip,
        ...(isVip ? { vipSince: new Date() } : {}),
      },
    })

    return user
  }

  // Admin — Customer Directory

  // Paginated customer list with per-customer order, spend, and review counts.
  // Search matches email or name; role optionally narrows to staff accounts.
  async findAllCustomers(filters: AdminCustomersFilterDto) {
    const { q, role, page = 1, limit = 20 } = filters
    const skip = (page - 1) * limit
    const search = q?.trim()

    const where = {
      ...(role ? { role } : {}),
      ...(search
        ? {
            OR: [
              { email: { contains: search, mode: 'insensitive' as const } },
              { firstName: { contains: search, mode: 'insensitive' as const } },
              { lastName: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    }

    const [users, total] = await Promise.all([
      this.prisma.client.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          isVip: true,
          vipSince: true,
          emailVerified: true,
          createdAt: true,
        },
      }),
      this.prisma.client.user.count({ where }),
    ])

    const meta = { total, page, limit, totalPages: Math.ceil(total / limit) }

    if (users.length === 0) {
      return { data: [], meta }
    }

    // Aggregates for the current page only — one grouped query each rather
    // than a per-row lookup.
    const ids = users.map((user) => user.id)

    const [orderStats, reviewStats] = await Promise.all([
      this.prisma.client.order.groupBy({
        by: ['userId'],
        where: {
          userId: { in: ids },
          status: { in: QUALIFYING_ORDER_STATUSES },
        },
        _count: { _all: true },
        _sum: { total: true },
        _max: { createdAt: true },
      }),
      this.prisma.client.review.groupBy({
        by: ['userId'],
        where: { userId: { in: ids } },
        _count: { _all: true },
      }),
    ])

    const ordersByUser = new Map(orderStats.map((stat) => [stat.userId, stat]))
    const reviewsByUser = new Map(
      reviewStats.map((stat) => [stat.userId, stat]),
    )

    return {
      data: users.map((user) => ({
        ...user,
        ordersCount: ordersByUser.get(user.id)?._count._all ?? 0,
        lifetimeSpend: ordersByUser.get(user.id)?._sum.total ?? 0,
        lastOrderAt: ordersByUser.get(user.id)?._max.createdAt ?? null,
        reviewsCount: reviewsByUser.get(user.id)?._count._all ?? 0,
      })),
      meta,
    }
  }

  // Admin — single customer profile: contact details, stats, recent orders,
  // reviews, cart size, and newsletter tags.
  async findCustomer(userId: string) {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        role: true,
        isVip: true,
        vipSince: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      throw new NotFoundException('Customer not found')
    }

    const [orderAggregate, recentOrders, reviews, cartItemsCount, subscriber] =
      await Promise.all([
        this.prisma.client.order.aggregate({
          where: { userId, status: { in: QUALIFYING_ORDER_STATUSES } },
          _count: { _all: true },
          _sum: { total: true },
          _max: { createdAt: true },
        }),
        this.prisma.client.order.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            status: true,
            total: true,
            trackingNumber: true,
            createdAt: true,
            shippingZone: { select: { name: true } },
          },
        }),
        this.prisma.client.review.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            rating: true,
            comment: true,
            status: true,
            createdAt: true,
            product: { select: { name: true, slug: true } },
          },
        }),
        this.prisma.client.cartItem.count({ where: { cart: { userId } } }),
        this.prisma.client.subscriber.findUnique({
          where: { email: user.email },
          select: { tags: true, active: true, createdAt: true },
        }),
      ])

    return {
      ...user,
      stats: {
        ordersCount: orderAggregate._count._all,
        lifetimeSpend: orderAggregate._sum.total ?? 0,
        lastOrderAt: orderAggregate._max.createdAt ?? null,
        reviewsCount: reviews.length,
      },
      recentOrders,
      reviews,
      cartItemsCount,
      subscriber: subscriber ?? null,
    }
  }
}
