import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { AllowAnonymous } from '@thallesp/nestjs-better-auth'
import { ContentService } from './content.service'
import { CreateContentBlockDto } from './dto/create-content-block.dto'
import { UpdateContentBlockDto } from './dto/update-content-block.dto'
import { FilterContentDto } from './dto/filter-content.dto'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/guards/roles.guard'

/**
 * Content controller drives the CMS backbone of the homepage.
 * Public endpoints serve section data to the frontend for dynamic rendering.
 * Admin endpoints (POST/PATCH/DELETE) power the homepage builder in the dashboard.
 */
@ApiTags('Content')
@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  /**
   * GET /content — returns active blocks currently inside their display window,
   * sorted by sortOrder. Optional ?type= narrows the result to one placement.
   * No auth required — homepage must load for all visitors.
   */
  @Get()
  @AllowAnonymous()
  @ApiOperation({ summary: 'List active, in-window content blocks (optional type filter)' })
  findAll(@Query() filters: FilterContentDto) {
    return this.contentService.findAll(filters)
  }

  /**
   * GET /content/all - returns every block regardless of active state or schedule.
   * Admin only. Powers the content manager so scheduled and inactive blocks stay editable.
   * Declared before :id so "all" is not captured as a route parameter.
   */
  @Get('all')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all content blocks incl. inactive and scheduled (admin only)' })
  findAllForAdmin() {
    return this.contentService.findAllForAdmin()
  }

  /**
   * GET /content/:id — returns a single block by id.
   * Useful for page-level fetching if only one block is needed.
   */
  @Get(':id')
  @AllowAnonymous()
  @ApiOperation({ summary: 'Get a single content block by id' })
  findOne(@Param('id') id: string) {
    return this.contentService.findById(id)
  }

  /**
   * POST /content — creates a new homepage section.
   * Admin only. Section must be unique — duplicate returns 409.
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new content block (admin only)' })
  create(@Body() dto: CreateContentBlockDto) {
    return this.contentService.create(dto)
  }

  /**
   * PATCH /content/:id — updates an existing block's content.
   * Admin only. Used by the homepage builder to edit hero copy, CTAs, etc.
   */
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a content block by id (admin only)' })
  update(@Param('id') id: string, @Body() dto: UpdateContentBlockDto) {
    return this.contentService.update(id, dto)
  }

  /**
   * DELETE /content/:id — removes a block and its associated assets.
   * Admin only. Cascading delete handles the polymorphic Asset cleanup.
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a content block by id (admin only)' })
  delete(@Param('id') id: string) {
    return this.contentService.delete(id)
  }
}
