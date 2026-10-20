import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { AllowAnonymous } from '@thallesp/nestjs-better-auth'
import { Roles, RolesGuard } from '../../auth/guards/roles.guard'
import { CreateShippingZoneDto } from './dto/create-shipping-zone.dto'
import { UpdateShippingZoneDto } from './dto/update-shipping-zone.dto'
import { ShippingZonesService } from './shipping-zones.service'

/**
 * ShippingZones controller — public read access to active delivery rates
 * plus an admin-only surface for managing the zones themselves.
 * The checkout UI consumes the public route to display shipping costs
 * before order creation. Zone rates are public pricing data; the write
 * routes require an admin session.
 */
@ApiTags('ShippingZones')
@Controller('shipping-zones')
export class ShippingZonesController {
  constructor(private readonly shippingZonesService: ShippingZonesService) {}

  /**
   * GET /shipping-zones
   * Returns all active zones with their NGN flat rates.
   */
  @Get()
  @AllowAnonymous()
  @ApiOperation({ summary: 'List active shipping zones with rates' })
  findActive() {
    return this.shippingZonesService.findActive()
  }

  /**
   * GET /shipping-zones/admin
   * Returns every zone — active and inactive — with ids, so the admin
   * settings page can list and edit them. Admin only.
   */
  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all shipping zones, including inactive (admin only)' })
  findAll() {
    return this.shippingZonesService.findAll()
  }

  /**
   * POST /shipping-zones
   * Creates a new zone. Admin only.
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a shipping zone (admin only)' })
  create(@Body() dto: CreateShippingZoneDto) {
    return this.shippingZonesService.create(dto)
  }

  /**
   * PATCH /shipping-zones/:id
   * Partially updates a zone. Admin only.
   */
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a shipping zone by id (admin only)' })
  update(@Param('id') id: string, @Body() dto: UpdateShippingZoneDto) {
    return this.shippingZonesService.update(id, dto)
  }
}
