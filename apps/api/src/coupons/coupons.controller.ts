import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { CouponsService } from './coupons.service'
import { ValidateCouponDto } from './dto/validate-coupon.dto'
import { CreateCouponDto } from './dto/create-coupon.dto'
import { UpdateCouponDto } from './dto/update-coupon.dto'
import { RolesGuard, Roles } from '../auth/guards/roles.guard'

/**
 * Coupons controller — manages coupon lifecycle.
 * Admin CRUD follows the same conventions as Content and Categories.
 * Pre-flight validation stays public so the checkout UI can check codes.
 */
@ApiTags('Coupons')
@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  /**
   * POST /coupons/validate
   * Pre-flight validation — called by the checkout UI before order submission.
   * Returns discount amount if valid. Public endpoint — userId extracted from session if present.
   */
  @Post('validate')
  @ApiOperation({ summary: 'Validate a coupon code against cart contents' })
  async validate(@Body() dto: ValidateCouponDto, @Request() req: any) {
    // Extract userId from session if authenticated — enables per-user limit check
    const userId: string | null = req.user?.id ?? null
    const result = await this.couponsService.validateCoupon(dto, userId)
    return { valid: true, ...result }
  }

  /**
   * GET /coupons
   * Lists all coupons, newest first. Admin only.
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all coupons (admin only)' })
  findAll() {
    return this.couponsService.findAll()
  }

  /**
   * GET /coupons/:id
   * Returns a single coupon by id. Admin only.
   */
  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a single coupon by id (admin only)' })
  findOne(@Param('id') id: string) {
    return this.couponsService.findOne(id)
  }

  /**
   * POST /coupons
   * Creates a new coupon with an uppercased code. Admin only.
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new coupon (admin only)' })
  create(@Body() dto: CreateCouponDto) {
    return this.couponsService.create(dto)
  }

  /**
   * PATCH /coupons/:id
   * Partially updates a coupon. Admin only.
   */
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a coupon by id (admin only)' })
  update(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
    return this.couponsService.update(id, dto)
  }

  /**
   * DELETE /coupons/:id
   * Removes a coupon. Admin only. Cascade clears its CouponUse rows.
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a coupon by id (admin only)' })
  remove(@Param('id') id: string) {
    return this.couponsService.remove(id)
  }
}
