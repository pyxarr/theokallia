import { Injectable, ConflictException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateContentBlockDto } from './dto/create-content-block.dto'
import { UpdateContentBlockDto } from './dto/update-content-block.dto'
import { FilterContentDto } from './dto/filter-content.dto'

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns all content blocks sorted by display order.
   * The admin dashboard uses this to render the homepage builder.
   * Public — the frontend fetches this to render homepage sections dynamically.
   */
  async findAll(filters: FilterContentDto = {}) {
    const now = new Date()

    return this.prisma.client.contentBlock.findMany({
      where: {
        active: true,
        ...(filters.type ? { type: filters.type } : {}),
        // Two independent windows: startsAt must have opened, endsAt must not have closed
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      orderBy: { sortOrder: 'asc' },
    })
  }

  /**
   * Returns every content block regardless of active state or schedule,
   * sorted by sortOrder ascending. Used by the admin content manager.
   */
  async findAllForAdmin() {
    return this.prisma.client.contentBlock.findMany({
      orderBy: { sortOrder: 'asc' },
    })
  }

  /**
   * Returns a single content block by its section identifier.
   * Sections are unique (hero, promotions, banners, featured).
   * Throws 404 if the section doesn't exist — caller should handle gracefully.
   */
  async findById(id: string) {
    const block = await this.prisma.client.contentBlock.findUnique({
      where: { id },
    })

    if (!block) {
      throw new NotFoundException(`Content block with id '${id}' not found`)
    }

    return block
  }

  /**
   * Creates a new content block for a section.
   * The admin dashboard calls this when adding a new homepage section.
   */
  async create(dto: CreateContentBlockDto) {
    return this.prisma.client.contentBlock.create({ data: dto })
  }

  /**
   * Updates a content block by id.
   * If the section field itself is being changed, checks that the new section name
   * isn't already taken — same uniqueness constraint as create.
   */
  async update(id: string, dto: UpdateContentBlockDto) {
    // confirm the block exists before attempting updates
    await this.findById(id)

    return this.prisma.client.contentBlock.update({
      where: { id },
      data: dto,
    })
  }

  /**
   * Deletes a content block by id.
   * Cascades to associated assets — polymorphic Asset records with
   * entityType = 'ContentBlock' and matching entityId are also removed.
   */
  async delete(id: string) {
    await this.findById(id)

    await this.prisma.client.contentBlock.delete({
      where: { id },
    })

    return { message: `Content block with id '${id}' deleted successfully` }
  }
}
