import { Injectable } from '@nestjs/common'
import { SiteConfig } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { UpdateSiteConfigDto } from './dto/update-site-config.dto'

// The settings table holds exactly one row, pinned to this id.
const SINGLETON_ID = 'singleton'

/**
 * SiteConfigService — reads and writes the single global settings row
 * (VIP promotion thresholds, welcome-discount parameters).
 * The row may not exist yet, so every read guarantees it is present.
 */
@Injectable()
export class SiteConfigService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns the singleton settings row, creating it with the schema
   * defaults the first time it is requested.
   */
  async get(): Promise<SiteConfig> {
    const existing = await this.prisma.client.siteConfig.findUnique({
      where: { id: SINGLETON_ID },
    })

    if (existing) {
      return existing
    }

    return this.prisma.client.siteConfig.create({ data: { id: SINGLETON_ID } })
  }

  /**
   * Applies the given fields to the singleton settings row and returns
   * the updated row. Fields left out of the DTO keep their current value.
   */
  async update(dto: UpdateSiteConfigDto): Promise<SiteConfig> {
    // Ensure the row exists before updating it.
    await this.get()

    return this.prisma.client.siteConfig.update({
      where: { id: SINGLETON_ID },
      data: { ...dto },
    })
  }
}
