import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { SiteConfigService } from './site-config.service'
import { UpdateSiteConfigDto } from './dto/update-site-config.dto'
import { RolesGuard, Roles } from '../auth/guards/roles.guard'

/**
 * SiteConfig controller — exposes the single global settings row.
 * Every route is admin only: there is no anonymous path to these values.
 */
@ApiTags('SiteConfig')
@Controller('site-config')
export class SiteConfigController {
  constructor(private readonly siteConfigService: SiteConfigService) {}

  /**
   * GET /site-config
   * Returns the current global store settings. Admin only.
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the global site settings (admin only)' })
  get() {
    return this.siteConfigService.get()
  }

  /**
   * PATCH /site-config
   * Partially updates the global store settings. Admin only.
   */
  @Patch()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update the global site settings (admin only)' })
  update(@Body() dto: UpdateSiteConfigDto) {
    return this.siteConfigService.update(dto)
  }
}
