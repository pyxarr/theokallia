import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { AddToCartDto } from './dto/add-to-cart.dto'
import { UpdateCartItemDto } from './dto/update-cart-item.dto'
import { MergeCartDto } from './dto/merge-cart.dto'
import { ValidateGuestCartDto } from './dto/validate-guest-cart.dto'

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) { }

  // helpers 

  /**
   * Returns the user's cart with all items and their product details.
   * Creates the cart if it doesn't exist yet — every user gets one cart, lazily.
   */
  private async getOrCreateCart(userId: string) {
    return this.prisma.client.cart.upsert({
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
                subcategory: { select: { name: true } },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })
  }

  /**
   * Merges assets into each cart item's product by fetching them in a single batch query.
   * Assets are polymorphic (entityType + entityId) so Prisma can't include them directly.
   */
  private async attachAssets(
    items: Array<{ product: { id: string } }>,
  ) {
    const ids = [...new Set(items.map((i) => i.product.id))]
    if (ids.length === 0) return

    const assets = await this.prisma.client.asset.findMany({
      where: { entityType: 'Product', entityId: { in: ids } },
      orderBy: { sortOrder: 'asc' },
    })

    const map = new Map<string, (typeof assets)[number][]>()
    for (const asset of assets) {
      const group = map.get(asset.entityId) ?? []
      group.push(asset)
      map.set(asset.entityId, group)
    }

    // mutate cart items in-place — caller already has the reference
    for (const item of items) {
      ;(item.product as Record<string, unknown>).assets = map.get(item.product.id) ?? []
    }
  }

  // public methods

  /**
   * GET /cart — returns the current user's full cart with all items.
   * Caps each item's quantity against current product stock and writes back
   * any changes to the DB — ensures CartItem quantities never exceed available stock
   * even if stock was reduced after items were added.
   */
  async getCart(userId: string) {
    const cart = await this.getOrCreateCart(userId)

    // cap each item's quantity against current product stock
    const validatedItems = cart.items.map((item) => ({
      ...item,
      quantity: Math.min(item.quantity, item.product.stock),
    }))

    // write capped quantities back to DB for items that changed
    // this ensures stock going back up doesn't restore the old inflated quantity
    const itemsToUpdate = validatedItems.filter(
      (item, i) => item.quantity !== cart.items[i].quantity,
    )

    if (itemsToUpdate.length > 0) {
      await Promise.all(
        itemsToUpdate.map((item) =>
          this.prisma.client.cartItem.update({
            where: { id: item.id },
            data: { quantity: item.quantity },
          }),
        ),
      )
    }

    // attach polymorphic assets to each product
    await this.attachAssets(validatedItems)

    // compute total from validated quantities — not raw cart quantities
    const total = validatedItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    )

    return { ...cart, items: validatedItems, total }
  }

  /**
   * POST /cart — adds a product to the cart.
   * If the product is already in the cart, increments quantity.
   * Validates combined quantity (existing + new) against available stock before updating.
   */
  async addItem(userId: string, dto: AddToCartDto) {
    const cart = await this.getOrCreateCart(userId)

    const product = await this.prisma.client.product.findUnique({
      where: { id: dto.productId },
    })

    if (!product) {
      throw new NotFoundException('Product not found')
    }

    if (!product.inStock) {
      throw new ForbiddenException('Product is out of stock')
    }

    // check if this product is already sitting in the cart
    const existingItem = await this.prisma.client.cartItem.findUnique({
      where: {
        cartId_productId: { cartId: cart.id, productId: dto.productId },
      },
    })

    const existingQuantity = existingItem?.quantity ?? 0
    const totalQuantity = existingQuantity + dto.quantity

    // validate against the combined quantity, not just what's being added now
    if (totalQuantity > product.stock) {
      throw new ForbiddenException(
        `Only ${product.stock - existingQuantity} more of this item can be added`,
      )
    }

    await this.prisma.client.cartItem.upsert({
      where: {
        cartId_productId: { cartId: cart.id, productId: dto.productId },
      },
      create: {
        cartId: cart.id,
        productId: dto.productId,
        quantity: dto.quantity,
      },
      update: {
        quantity: { increment: dto.quantity },
      },
    })

    return this.getCart(userId)
  }

  /**
   * PATCH /cart/:itemId — updates the quantity of a specific cart item.
   * Only the owner can update it. Validates new quantity against available stock.
   */
  async updateItem(userId: string, itemId: string, dto: UpdateCartItemDto) {
    const item = await this.prisma.client.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    })

    if (!item) {
      throw new NotFoundException('Cart item not found')
    }

    if (item.cart.userId !== userId) {
      throw new ForbiddenException('You do not have permission to update this cart item')
    }

    // validate new quantity against available stock before updating
    const product = await this.prisma.client.product.findUnique({
      where: { id: item.productId },
    })

    if (!product || !product.inStock || dto.quantity > product.stock) {
      throw new ForbiddenException(
        `Quantity cannot exceed available stock of ${product?.stock ?? 0}`
      )
    }

    await this.prisma.client.cartItem.update({
      where: { id: itemId },
      data: { quantity: dto.quantity },
    })

    return this.getCart(userId)
  }

  /**
   * DELETE /cart/:itemId — removes a single item from the cart.
   * Only the owner can remove their own items.
   */
  async removeItem(userId: string, itemId: string) {
    const item = await this.prisma.client.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    })

    if (!item) {
      throw new NotFoundException('Cart item not found')
    }

    if (item.cart.userId !== userId) {
      throw new ForbiddenException('You do not have permission to remove this cart item')
    }

    await this.prisma.client.cartItem.delete({ where: { id: itemId } })

    return this.getCart(userId)
  }

  /**
   * DELETE /cart — clears all items from the cart without deleting the cart itself.
   * Used after checkout to reset the cart, and optionally from a "clear cart" UI button.
   */
  async clearCart(userId: string) {
    const cart = await this.getOrCreateCart(userId)

    await this.prisma.client.cartItem.deleteMany({
      where: { cartId: cart.id },
    })

    return this.getCart(userId)
  }

  /**
   * POST /cart/merge — called immediately after login.
   * Takes the guest's localStorage items and upserts them into their DB cart.
   * If the user already has a cart item for the same product, quantities are summed.
   * After this call, the frontend clears localStorage and switches to DB as source of truth.
   */
  async mergeCart(userId: string, dto: MergeCartDto) {
    if (!dto.items.length) {
      // nothing to merge — just return the existing DB cart
      return this.getCart(userId)
    }

    const cart = await this.getOrCreateCart(userId)

    // upsert each localStorage item into the DB cart
    // prisma.$transaction ensures all upserts succeed or all roll back
    await this.prisma.client.$transaction(
      async (tx) => {
        for (const item of dto.items) {
          // fetch product to get current stock
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          })

          if (!product || !product.inStock) continue // skip unavailable products silently

          // check what's already in the cart for this product
          const existing = await tx.cartItem.findUnique({
            where: {
              cartId_productId: { cartId: cart.id, productId: item.productId },
            },
          })

          const existingQty = existing?.quantity ?? 0
          // cap merged quantity at available stock — never exceed what's in DB
          const mergedQty = Math.min(existingQty + item.quantity, product.stock)

          await tx.cartItem.upsert({
            where: {
              cartId_productId: { cartId: cart.id, productId: item.productId },
            },
            create: {
              cartId: cart.id,
              productId: item.productId,
              quantity: mergedQty,
            },
            update: {
              quantity: mergedQty, // set directly, not increment — we computed the safe value above
            },
          })
        }
      }
    )

    return this.getCart(userId)
  }

  /**
 * POST /cart/validate-guest — public endpoint, no auth required.
 * Accepts a list of productIds from the guest's localStorage cart.
 * Returns current stock and inStock status for each product.
 * Called during guest cart hydration to sync stale stock values in localStorage.
 */
  async validateGuestCart(dto: ValidateGuestCartDto) {
    const products = await this.prisma.client.product.findMany({
      where: {
        id: { in: dto.productIds },
      },
      select: {
        id: true,
        stock: true,
        inStock: true,
      },
    })

    // return a flat array — one entry per productId
    // frontend maps over this to update localStorage stock values
    return products.map((product) => ({
      productId: product.id,
      stock: product.stock,
      inStock: product.inStock,
    }))
  }
}