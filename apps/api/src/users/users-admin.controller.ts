import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { UsersService } from './users.service'
import { AdminCustomersFilterDto } from './dto/admin-users.dto'
import { RolesGuard, Roles } from '../auth/guards/roles.guard'

/**
 * Customer directory for the admin dashboard.
 *
 * Exposes customer PII, so the whole controller is admin-only and every query
 * selects only the fields the dashboard renders — never password hashes or
 * auth account rows.
 */
@ApiTags('Users (admin)')
@Controller('users/admin')
@UseGuards(RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class UsersAdminController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /users/admin
   * Directory with per-customer order count, lifetime spend, and last order.
   */
  @Get()
  @ApiOperation({
    summary: 'List customers with order and spend summaries (admin only)',
  })
  findAll(@Query() filters: AdminCustomersFilterDto) {
    return this.usersService.findAllCustomers(filters)
  }

  /**
   * GET /users/admin/:id
   * Full customer profile: contact details, stats, recent orders, and reviews.
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Customer profile with orders and reviews (admin only)',
  })
  findOne(@Param('id') id: string) {
    return this.usersService.findCustomer(id)
  }
}
