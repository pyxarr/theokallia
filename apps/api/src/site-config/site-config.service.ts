import { Injectable } from '@nestjs/common'
import { SiteConfig } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { isUniqueConstraintError } from '../utils/unique-constraint'
import { UpdateSiteConfigDto } from './dto/update-site-config.dto'

// The settings table holds exactly one row, pinned to this id.
const SINGLETON_ID = 'singleton'

/**
 * SiteConfigService — reads and writes the single global settings row
 * (the VIP promotion thresholds).
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

    try {
      return await this.prisma.client.siteConfig.create({
        data: { id: SINGLETON_ID },
      })
    } catch (err) {
      // Two requests against a fresh database can both see no row and
      // both try to create it. The loser gets a unique-constraint error,
      // so the row the winner just wrote is re-read and returned
      // instead of failing the request with a 500.
      if (isUniqueConstraintError(err)) {
        const created = await this.prisma.client.siteConfig.findUnique({
          where: { id: SINGLETON_ID },
        })

        if (created) {
          return created
        }
      }

      // Anything else — and the impossible case where the row still is
      // not there — is the original error.
      throw err
    }
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
