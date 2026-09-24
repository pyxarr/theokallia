import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

/**
 * ShippingZonesService exposes read-only access to active delivery zones.
 * Rates live in the ShippingZone table; zone selection logic stays in
 * shipping-zone-mapping.config.ts (state/country to zone name).
 */
@Injectable()
export class ShippingZonesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns all active shipping zones, ordered by creation date.
   * Only name, rate, and active are exposed — no ids or timestamps.
   */
  async findActive() {
    const zones = await this.prisma.client.shippingZone.findMany({
      where: { active: true },
      select: { name: true, rate: true, active: true },
      orderBy: { createdAt: 'asc' },
    })
    return zones
  }
}
