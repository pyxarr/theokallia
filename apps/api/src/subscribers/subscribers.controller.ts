import {
  Body,
  Controller,
  Get,
  Patch,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { AllowAnonymous } from '@thallesp/nestjs-better-auth'
import { SubscribersService } from './subscribers.service'
import { SubscribeDto } from './dto/subscribe.dto'
import {
  FilterSubscribersDto,
  SetSubscriberActiveDto,
} from './dto/filter-subscribers.dto'
import { RolesGuard, Roles } from '../auth/guards/roles.guard'

/**
 * Subscribers controller backs the newsletter list.
 * Public signup serves the storefront form; the listing is admin only.
 */
@ApiTags('Subscribers')
@Controller('subscribers')
export class SubscribersController {
  constructor(private readonly subscribersService: SubscribersService) {}

  /**
   * POST /subscribers — public newsletter signup.
   * Returns the same message whether or not the email was already subscribed,
   * so membership is never leaked to the caller.
   */
  @Post()
  @AllowAnonymous()
  @ApiOperation({ summary: 'Subscribe an email to the newsletter' })
  async subscribe(@Body() dto: SubscribeDto) {
    await this.subscribersService.subscribe(dto)
    return { success: true, message: 'You are on the list. Watch your inbox.' }
  }

  /**
   * GET /subscribers — paginated subscriber list with optional tag filter.
   * Admin only.
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List newsletter subscribers (admin only)' })
  findAll(@Query() filters: FilterSubscribersDto) {
    return this.subscribersService.findAll(filters)
  }

  /**
   * GET /subscribers/counts — totals by activity and tag for the tab badges.
   * Declared before the email route so 'counts' is never captured as an email.
   * Admin only.
   */
  @Get('counts')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Count subscribers by activity and tag (admin only)',
  })
  counts() {
    return this.subscribersService.countByState()
  }

  /**
   * PATCH /subscribers/:id — admin archive/reactivate. The active flag is
   * the archive switch: false takes the contact out of sends, true brings
   * them back. Never deletes the record.
   */
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Archive or reactivate a subscriber (admin only)' })
  setActive(
    @Param('id') id: string,
    @Body() dto: SetSubscriberActiveDto,
  ) {
    return this.subscribersService.setActiveById(id, dto.active)
  }
}
