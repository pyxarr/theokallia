import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { AllowAnonymous, Session, UserSession } from '@thallesp/nestjs-better-auth'
import { CartService } from './cart.service'
import { AddToCartDto } from './dto/add-to-cart.dto'
import { MergeCartDto } from './dto/merge-cart.dto'
import { UpdateCartItemDto } from './dto/update-cart-item.dto'
import { ValidateGuestCartDto } from './dto/validate-guest-cart.dto'

@ApiTags('Cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) { }

  @Post('validate-guest')
  @AllowAnonymous()
  @ApiOperation({
    summary: 'Validate guest cart stock',
    description: 'Public endpoint — no auth required. Accepts a list of productIds from the guest localStorage cart and returns current stock and inStock status for each. Called during guest cart hydration to sync stale stock values.',
  })
  @ApiResponse({ status: 201, description: 'Stock data returned successfully' })
  validateGuestCart(@Body() dto: ValidateGuestCartDto) {
    return this.cartService.validateGuestCart(dto)
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get the current user\'s cart',
    description: 'Returns the cart with all items, product details, and a computed total. Creates an empty cart if one does not exist yet.',
  })
  @ApiResponse({ status: 200, description: 'Cart returned successfully' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  getCart(@Session() session: UserSession) {
    return this.cartService.getCart(session.user.id)
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Add a product to the cart',
    description: 'Adds a product to the cart. If the product is already in the cart, the quantity is incremented. Validates that the product exists and is in stock.',
  })
  @ApiResponse({ status: 201, description: 'Item added, full cart returned' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 403, description: 'Product out of stock' })
  addItem(@Session() session: UserSession, @Body() dto: AddToCartDto) {
    return this.cartService.addItem(session.user.id, dto)
  }

  @Post('merge')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Merge localStorage cart into DB cart after login',
    description: 'Called immediately after a successful login if the user had items in their localStorage (guest) cart. Upserts all items into the DB cart, summing quantities where a product already exists. The frontend should clear localStorage after this call.',
  })
  @ApiResponse({ status: 201, description: 'Carts merged, full DB cart returned' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  mergeCart(@Session() session: UserSession, @Body() dto: MergeCartDto) {
    return this.cartService.mergeCart(session.user.id, dto)
  }

  @Patch(':itemId')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update the quantity of a cart item',
    description: 'Updates the quantity of a specific cart item. Use DELETE to remove an item entirely. Only the owner can update their own cart items.',
  })
  @ApiParam({ name: 'itemId', description: 'The ID of the CartItem to update' })
  @ApiResponse({ status: 200, description: 'Item updated, full cart returned' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Not the cart owner' })
  @ApiResponse({ status: 404, description: 'Cart item not found' })
  updateItem(
    @Session() session: UserSession,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(session.user.id, itemId, dto)
  }

  @Delete('clear')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Clear all items from the cart',
    description: 'Removes all items from the cart without deleting the cart itself. Called after a successful checkout or from a "clear cart" UI button.',
  })
  @ApiResponse({ status: 200, description: 'Cart cleared, empty cart returned' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  clearCart(@Session() session: UserSession) {
    return this.cartService.clearCart(session.user.id)
  }

  @Delete(':itemId')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Remove a single item from the cart',
    description: 'Removes one specific item from the cart. Only the owner can remove their own items.',
  })
  @ApiParam({ name: 'itemId', description: 'The ID of the CartItem to remove' })
  @ApiResponse({ status: 200, description: 'Item removed, full cart returned' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Not the cart owner' })
  @ApiResponse({ status: 404, description: 'Cart item not found' })
  removeItem(@Session() session: UserSession, @Param('itemId') itemId: string) {
    return this.cartService.removeItem(session.user.id, itemId)
  }
}
