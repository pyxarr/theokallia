import { Controller, Get } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { AllowAnonymous } from '@thallesp/nestjs-better-auth'
import { ShippingZonesService } from './shipping-zones.service'

/**
 * ShippingZones controller — public read access to active delivery rates.
 * The checkout UI consumes this to display shipping costs before order creation.
 * No auth required — zone rates are public pricing data.
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
}
