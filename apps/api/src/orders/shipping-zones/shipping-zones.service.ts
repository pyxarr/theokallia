import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { ShippingZone } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { isUniqueConstraintError } from '../../utils/unique-constraint'
import { CreateShippingZoneDto } from './dto/create-shipping-zone.dto'
import { UpdateShippingZoneDto } from './dto/update-shipping-zone.dto'

/**
 * ShippingZonesService exposes read-only access to active delivery zones.
 * Rates live in the ShippingZone table; zone selection logic stays in
 * shipping-zone-mapping.config.ts (state/country to zone name).
 *
 * The admin surface (list all, create, update) lives here too so the
 * settings page can manage the same rows the checkout reads.
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

  /**
   * Returns every shipping zone — active and inactive — ordered by
   * creation date, with ids so the admin UI can edit a specific row.
   */
  async findAll(): Promise<Array<Pick<ShippingZone, 'id' | 'name' | 'rate' | 'active'>>> {
    // Only the four editable columns are selected — the relation and
    // timestamp columns of the full row are never needed here.
    return this.prisma.client.shippingZone.findMany({
      select: { id: true, name: true, rate: true, active: true },
      orderBy: { createdAt: 'asc' },
    })
  }

  /**
   * Creates a zone. Names are unique in the DB, so a duplicate name
   * surfaces as a Prisma unique-constraint error and is translated
   * into a 409 Conflict.
   */
  async create(dto: CreateShippingZoneDto): Promise<ShippingZone> {
    const name = dto.name.trim()

    try {
      return await this.prisma.client.shippingZone.create({
        data: { name, rate: dto.rate, active: dto.active ?? true },
      })
    } catch (err) {
      if (isUniqueConstraintError(err)) {
        throw new ConflictException('A shipping zone named "' + name + '" already exists.')
      }
      throw err
    }
  }

  /**
   * Applies the given fields to an existing zone and returns the
   * updated row. Fields left out of the DTO keep their current value.
   *
   * The zone name can NOT be changed here. Checkout resolves a zone by
   * name (`shipping-zone-mapping.config.ts` returns the name, and
   * `orders.service.ts` looks the rate up by name), and the state
   * mapping rows reference the zone by id — so a rename would break
   * every order routed through that zone.
   */
  async update(id: string, dto: UpdateShippingZoneDto): Promise<ShippingZone> {
    const existing = await this.prisma.client.shippingZone.findUnique({
      where: { id },
    })

    if (!existing) {
      throw new NotFoundException('Shipping zone ' + id + ' not found.')
    }

    try {
      return await this.prisma.client.shippingZone.update({
        where: { id },
        data: {
          ...(dto.rate !== undefined && { rate: dto.rate }),
          ...(dto.active !== undefined && { active: dto.active }),
        },
      })
    } catch (err) {
      // The name is no longer writable, so the unique constraint on it
      // cannot be violated here — but a future constraint could, and an
      // unhandled Prisma error would surface as a 500.
      if (isUniqueConstraintError(err)) {
        throw new ConflictException(
          'This shipping zone conflicts with another record.',
        )
      }
      throw err
    }
  }
}
