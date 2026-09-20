import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { UpdateUserDto } from './dto/update-user.dto'

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) { }

  // Find a user by their database ID
  async findById(userId: string) {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new NotFoundException('User not found')
    }

    return user
  }

  // Find a user by email
  async findByEmail(email: string) {
    return this.prisma.client.user.findUnique({
      where: { email },
    })
  }

  // Check whether the account tied to this email has already been verified.
  async isEmailVerified(email: string) {
    const user = await this.findByEmail(email)

    return {
      verified: user?.emailVerified ?? false,
    }
  }

  // Update the current user's profile
  // Only fields provided in the DTO will be updated
  async updateMe(userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.client.user.update({
      where: { id: userId },
      data: dto,
    })

    return user
  }

  // Manually set a customer's VIP status (admin only).
  // Turning VIP on stamps vipSince; turning it off clears the flag but
  // keeps vipSince as a record of when they qualified.
  async setVip(userId: string, isVip: boolean) {
    await this.findById(userId)

    const user = await this.prisma.client.user.update({
      where: { id: userId },
      data: {
        isVip,
        ...(isVip ? { vipSince: new Date() } : {}),
      },
    })

    return user
  }
}
