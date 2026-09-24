import { Module } from '@nestjs/common'
import { ShippingZonesController } from './shipping-zones.controller'
import { ShippingZonesService } from './shipping-zones.service'

/**
 * ShippingZonesModule exposes public read access to delivery rates.
 * PrismaModule is @Global() so no import is needed here.
 * Selection logic (address to zone name) lives in the shared
 * shipping-zone-mapping.config.ts used by OrdersService.
 */
@Module({
  controllers: [ShippingZonesController],
  providers: [ShippingZonesService],
  exports: [ShippingZonesService],
})
export class ShippingZonesModule {}
