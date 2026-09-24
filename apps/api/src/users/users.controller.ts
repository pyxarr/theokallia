import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger'
import { AllowAnonymous, Session, UserSession } from '@thallesp/nestjs-better-auth'
import { UpdateUserDto } from './dto/update-user.dto'
import { SetVipDto } from './dto/set-vip.dto'
import { AdminCustomersFilterDto } from './dto/admin-users.dto'
import { UsersService } from './users.service'
import { RolesGuard, Roles } from '../auth/guards/roles.guard'

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ============ PUBLIC ENDPOINTS ============

  @Get('verification-status')
  @AllowAnonymous()
  @ApiOperation({ summary: 'Check if email is verified' })
  async verificationStatus(@Query('email') email: string) {
    if (!email) {
      return { verified: false }
    }

    return this.usersService.isEmailVerified(email)
  }

  // ============ USER ENDPOINTS (authenticated) ============

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getMe(@Session() session: UserSession) {
    return this.usersService.findById(session.user.id)
  }

  @Patch('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  async updateMe(@Session() session: UserSession, @Body() dto: UpdateUserDto) {
    return this.usersService.updateMe(session.user.id, dto)
  }

  // ============ ADMIN ENDPOINTS ============

  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List customers with order and spend summaries (admin only)',
  })
  findAllAdmin(@Query() filters: AdminCustomersFilterDto) {
    return this.usersService.findAllCustomers(filters)
  }

  @Get('admin/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Customer profile with orders and reviews (admin only)',
  })
  findOneAdmin(@Param('id') id: string) {
    return this.usersService.findCustomer(id)
  }

  @Patch(':id/vip')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set customer VIP status (admin)' })
  async setVip(@Param('id') id: string, @Body() dto: SetVipDto) {
    return this.usersService.setVip(id, dto.isVip)
  }
}
