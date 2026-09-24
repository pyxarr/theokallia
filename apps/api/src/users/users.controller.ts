import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common'
import { AllowAnonymous, Session, UserSession } from '@thallesp/nestjs-better-auth'
import { UpdateUserDto } from './dto/update-user.dto'
import { SetVipDto } from './dto/set-vip.dto'
import { UsersService } from './users.service'
import { RolesGuard, Roles } from '../auth/guards/roles.guard'

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // GET /users/verification-status?email=...
  // Lets the client re-check verification state on another device.
  @Get('verification-status')
  @AllowAnonymous()
  async verificationStatus(@Query('email') email: string) {
    if (!email) {
      return { verified: false }
    }

    return this.usersService.isEmailVerified(email)
  }

  // GET /users/me
  // Returns the current logged-in user's profile
  @Get('me')
  async getMe(@Session() session: UserSession) {
    return this.usersService.findById(session.user.id)
  }

  // PATCH /users/me
  // Updates the current logged-in user's profile
  @Patch('me')
  async updateMe(@Session() session: UserSession, @Body() dto: UpdateUserDto) {
    return this.usersService.updateMe(session.user.id, dto)
  }

  // PATCH /users/:id/vip
  // Admin-only manual override of a customer's VIP status.
  @Patch(':id/vip')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async setVip(@Param('id') id: string, @Body() dto: SetVipDto) {
    return this.usersService.setVip(id, dto.isVip)
  }
}
