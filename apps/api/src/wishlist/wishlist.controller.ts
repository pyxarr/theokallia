import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { Session, UserSession } from '@thallesp/nestjs-better-auth'
import { ToggleWishlistDto } from './dto/toggle-wishlist.dto'
import { WishlistService } from './wishlist.service'
import { MergeWishlistDto } from './dto/merge-wishlist.dto'

@ApiTags('Wishlist')
@ApiBearerAuth()
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) { }

  @Get()
  @ApiOperation({
    summary: 'Get the current user\'s wishlist',
    description: 'Returns the wishlist with all saved items and their product details. Creates an empty wishlist if one does not exist yet.',
  })
  @ApiResponse({ status: 200, description: 'Wishlist returned successfully' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  getWishlist(@Session() session: UserSession) {
    return this.wishlistService.getWishlist(session.user.id)
  }

  @Post('toggle')
  @ApiOperation({
    summary: 'Toggle a product in the wishlist',
    description: 'Adds the product to the wishlist if it is not there, removes it if it already is. Returns { wishlisted: boolean, wishlist } so the frontend can update the heart icon immediately without a separate GET.',
  })
  @ApiResponse({ status: 201, description: 'Toggled. Check wishlisted field in response.' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  toggleItem(@Session() session: UserSession, @Body() dto: ToggleWishlistDto) {
    return this.wishlistService.toggleItem(session.user.id, dto)
  }

  @Post('merge')
  @ApiOperation({
    summary: 'Merge localStorage wishlist into DB wishlist after login',
    description: 'Called immediately after login if the guest had wishlisted products. Adds any products not already in the DB wishlist. Already-wishlisted products are skipped. Frontend clears localStorage after this call.',
  })
  @ApiResponse({ status: 201, description: 'Wishlists merged, full DB wishlist returned' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  mergeWishlist(@Session() session: UserSession, @Body() dto: MergeWishlistDto) {
    return this.wishlistService.mergeWishlist(session.user.id, dto)
  }

  @Delete(':itemId')
  @ApiOperation({
    summary: 'Remove a specific wishlist item',
    description: 'Removes a wishlist item by its WishlistItem ID. Prefer POST /wishlist/toggle for normal UI interactions — use this only when you have a specific itemId to target.',
  })
  @ApiParam({ name: 'itemId', description: 'The ID of the WishlistItem to remove' })
  @ApiResponse({ status: 200, description: 'Item removed, updated wishlist returned' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 404, description: 'Wishlist item not found' })
  removeItem(@Session() session: UserSession, @Param('itemId') itemId: string) {
    return this.wishlistService.removeItem(session.user.id, itemId)
  }
}
