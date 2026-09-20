import { NotFoundException } from '@nestjs/common'
import { UsersService } from './users.service'
import { PrismaService } from '../prisma/prisma.service'

/**
 * Unit tests for the admin VIP override added in Phase 6.
 * Promoting stamps vipSince; demoting clears the flag but keeps vipSince
 * as a record of when the customer qualified.
 */
describe('UsersService — setVip', () => {
  const userDelegate = { findUnique: jest.fn(), update: jest.fn() }
  const prisma = { client: { user: userDelegate } }
  let service: UsersService

  beforeEach(() => {
    jest.resetAllMocks()
    service = new UsersService(prisma as unknown as PrismaService)
  })

  it('throws NotFoundException for an unknown user', async () => {
    userDelegate.findUnique.mockResolvedValueOnce(null)

    await expect(service.setVip('missing', true)).rejects.toBeInstanceOf(NotFoundException)
    expect(userDelegate.update).not.toHaveBeenCalled()
  })

  it('promotes a customer to VIP and stamps vipSince', async () => {
    userDelegate.findUnique.mockResolvedValueOnce({ id: 'usr_1' })
    userDelegate.update.mockResolvedValueOnce({ id: 'usr_1', isVip: true })

    await service.setVip('usr_1', true)

    expect(userDelegate.update).toHaveBeenCalledWith({
      where: { id: 'usr_1' },
      data: { isVip: true, vipSince: expect.any(Date) },
    })
  })

  it('demotes a customer without clearing vipSince', async () => {
    userDelegate.findUnique.mockResolvedValueOnce({ id: 'usr_1' })
    userDelegate.update.mockResolvedValueOnce({ id: 'usr_1', isVip: false })

    await service.setVip('usr_1', false)

    expect(userDelegate.update).toHaveBeenCalledWith({
      where: { id: 'usr_1' },
      data: { isVip: false },
    })
  })
})
