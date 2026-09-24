import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { ToggleWishlistDto } from './dto/toggle-wishlist.dto'
import { MergeWishlistDto } from './dto/merge-wishlist.dto'

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) { }

  // helpers

  /**
   * Returns the user's wishlist with all saved products.
   * Creates the wishlist if it doesn't exist yet — lazily, like the cart.
   */
  private async getOrCreateWishlist(userId: string) {
    const wishlist = await this.prisma.client.wishlist.upsert({
      where: { userId },
      create: { userId },
      update: {},
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                inStock: true,
                stock: true,
                category: { select: { name: true } },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    // batch-fetch polymorphic assets for all wishlisted products
    const ids = wishlist.items.map((i) => i.product.id)
    if (ids.length > 0) {
      const assets = await this.prisma.client.asset.findMany({
        where: { entityType: 'Product', entityId: { in: ids } },
        orderBy: { sortOrder: 'asc' },
      })

      const assetMap = new Map<string, (typeof assets)[number][]>()
      for (const asset of assets) {
        const group = assetMap.get(asset.entityId) ?? []
        group.push(asset)
        assetMap.set(asset.entityId, group)
      }

      for (const item of wishlist.items) {
        ;(item.product as Record<string, unknown>).assets = assetMap.get(item.product.id) ?? []
      }
    }

    return wishlist
  }

  // public methods

  /**
   * GET /wishlist — returns the user's full wishlist with product details.
   */
  async getWishlist(userId: string) {
    return this.getOrCreateWishlist(userId)
  }

  /**
   * POST /wishlist/toggle — add or remove a product from the wishlist.
   * If the product is already wishlisted → remove it (toggle off).
   * If the product is not wishlisted → add it (toggle on).
   * Returns { wishlisted: boolean } alongside the updated wishlist so the
   * frontend can update the heart icon state without extra logic.
   */
  async toggleItem(userId: string, dto: ToggleWishlistDto) {
    // verify product exists before touching the wishlist
    const product = await this.prisma.client.product.findUnique({
      where: { id: dto.productId },
    })

    if (!product) {
      throw new NotFoundException('Product not found')
    }

    const wishlist = await this.getOrCreateWishlist(userId)

    // check if this product is already in the wishlist
    const existing = await this.prisma.client.wishlistItem.findUnique({
      where: {
        wishlistId_productId: {
          wishlistId: wishlist.id,
          productId: dto.productId,
        },
      },
    })

    if (existing) {
      // already wishlisted → remove it
      await this.prisma.client.wishlistItem.delete({ where: { id: existing.id } })
      const updated = await this.getOrCreateWishlist(userId)
      return { wishlisted: false, wishlist: updated }
    } else {
      // not wishlisted → add it
      await this.prisma.client.wishlistItem.create({
        data: { wishlistId: wishlist.id, productId: dto.productId },
      })
      const updated = await this.getOrCreateWishlist(userId)
      return { wishlisted: true, wishlist: updated }
    }
  }

  /**
 * POST /wishlist/merge — called immediately after login.
 * Takes the guest's localStorage productIds and adds any that aren't
 * already in the DB wishlist. Already-wishlisted products are skipped.
 * After this call, the frontend clears localStorage.
 */
  async mergeWishlist(userId: string, dto: MergeWishlistDto) {
    if (!dto.productIds.length) {
      return this.getOrCreateWishlist(userId)
    }

    const wishlist = await this.getOrCreateWishlist(userId)

    // get all productIds already in the wishlist so we don't duplicate
    const existingProductIds = new Set(
      wishlist.items.map((item) => item.product.id),
    )

    // only process products not already wishlisted
    const toAdd = dto.productIds.filter((id) => !existingProductIds.has(id))

    if (toAdd.length === 0) {
      return wishlist
    }

    // verify all products exist before inserting
    const products = await this.prisma.client.product.findMany({
      where: { id: { in: toAdd } },
      select: { id: true },
    })

    const validIds = new Set(products.map((p) => p.id))

    // createMany with skipDuplicates as a safety net
    await this.prisma.client.wishlistItem.createMany({
      data: toAdd
        .filter((id) => validIds.has(id))
        .map((productId) => ({ wishlistId: wishlist.id, productId })),
      skipDuplicates: true,
    })

    return this.getOrCreateWishlist(userId)
  }

  /**
   * DELETE /wishlist/:itemId — removes a specific wishlist item by its own ID.
   * Alternative to toggle when you know the exact WishlistItem id.
   */
  async removeItem(userId: string, itemId: string) {
    // fetch the item and its parent wishlist to verify ownership
    const item = await this.prisma.client.wishlistItem.findUnique({
      where: { id: itemId },
      include: { wishlist: true },
    })

    if (!item) {
      throw new NotFoundException('Wishlist item not found')
    }

    if (item.wishlist.userId !== userId) {
      // prevent a user from deleting items from another user's wishlist
      throw new NotFoundException('Wishlist item not found') // intentionally vague — don't confirm existence
    }

    await this.prisma.client.wishlistItem.delete({ where: { id: itemId } })

    return this.getOrCreateWishlist(userId)
  }
}