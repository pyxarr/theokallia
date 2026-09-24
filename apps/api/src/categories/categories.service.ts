import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateCategoryDto } from './dto/create-category.dto'
import { UpdateCategoryDto } from './dto/update-category.dto'
import { CreateSubcategoryDto } from './dto/create-subcategory.dto'
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto'

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  // Categories

  async findAllCategories() {
    return this.prisma.client.category.findMany({
      include: {
        subcategories: {
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    })
  }

  async findOneCategory(slug: string) {
    const category = await this.prisma.client.category.findUnique({
      where: { slug },
      include: {
        subcategories: {
          orderBy: { name: 'asc' },
        },
      },
    })

    if (!category) {
      throw new NotFoundException(`Category '${slug}' not found`)
    }

    return category
  }

  async createCategory(dto: CreateCategoryDto) {
    const existing = await this.prisma.client.category.findUnique({
      where: { slug: dto.slug },
    })

    if (existing) {
      throw new ConflictException(
        `A category with slug '${dto.slug}' already exists`,
      )
    }

    return this.prisma.client.category.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        image: dto.image,
      },
      include: {
        subcategories: true,
      },
    })
  }

  async updateCategory(slug: string, dto: UpdateCategoryDto) {
    await this.findOneCategory(slug)

    if (dto.slug && dto.slug !== slug) {
      const slugTaken = await this.prisma.client.category.findUnique({
        where: { slug: dto.slug },
      })

      if (slugTaken) {
        throw new ConflictException(
          `A category with slug '${dto.slug}' already exists`,
        )
      }
    }

    return this.prisma.client.category.update({
      where: { slug },
      data: {
        name: dto.name,
        slug: dto.slug,
        image: dto.image,
      },
      include: {
        subcategories: true,
      },
    })
  }

  async deleteCategory(slug: string) {
    const category = await this.findOneCategory(slug)

    // Products referencing this category (directly or through a subcategory)
    // would violate the FK on delete — fail with a friendly 409 instead.
    const directProducts = await this.prisma.client.product.count({
      where: { categoryId: category.id },
    })
    const subcategoryIds = category.subcategories.map(
      (subcategory) => subcategory.id,
    )
    const subcategoryProducts = subcategoryIds.length
      ? await this.prisma.client.product.count({
          where: { subcategoryId: { in: subcategoryIds } },
        })
      : 0
    const productCount = directProducts + subcategoryProducts

    if (productCount > 0) {
      throw new ConflictException(
        `Category '${category.name}' still has ${productCount} product(s) assigned. Reassign them before deleting.`,
      )
    }

    // Subcategory.categoryId has no cascade — delete empty subcategories first.
    await this.prisma.client.$transaction(async (tx) => {
      await tx.subcategory.deleteMany({
        where: { categoryId: category.id },
      })
      await tx.category.delete({ where: { id: category.id } })
    })

    return { message: `Category '${category.name}' deleted successfully` }
  }

  // Subcategories

  async createSubcategory(categorySlug: string, dto: CreateSubcategoryDto) {
    const category = await this.findOneCategory(categorySlug)

    const existing = await this.prisma.client.subcategory.findUnique({
      where: { slug: dto.slug },
    })

    if (existing) {
      throw new ConflictException(
        `A subcategory with slug '${dto.slug}' already exists`,
      )
    }

    return this.prisma.client.subcategory.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        image: dto.image,
        categoryId: category.id,
      },
    })
  }

  async updateSubcategory(
    categorySlug: string,
    subSlug: string,
    dto: UpdateSubcategoryDto,
  ) {
    await this.findOneCategory(categorySlug)

    const subcategory = await this.prisma.client.subcategory.findUnique({
      where: { slug: subSlug },
    })

    if (!subcategory) {
      throw new NotFoundException(`Subcategory '${subSlug}' not found`)
    }

    if (dto.slug && dto.slug !== subSlug) {
      const slugTaken = await this.prisma.client.subcategory.findUnique({
        where: { slug: dto.slug },
      })

      if (slugTaken) {
        throw new ConflictException(
          `A subcategory with slug '${dto.slug}' already exists`,
        )
      }
    }

    return this.prisma.client.subcategory.update({
      where: { slug: subSlug },
      data: {
        name: dto.name,
        slug: dto.slug,
        image: dto.image,
      },
    })
  }

  async deleteSubcategory(categorySlug: string, subSlug: string) {
    await this.findOneCategory(categorySlug)

    const subcategory = await this.prisma.client.subcategory.findUnique({
      where: { slug: subSlug },
    })

    if (!subcategory) {
      throw new NotFoundException(`Subcategory '${subSlug}' not found`)
    }

    const productCount = await this.prisma.client.product.count({
      where: { subcategoryId: subcategory.id },
    })

    if (productCount > 0) {
      throw new ConflictException(
        `Subcategory '${subcategory.name}' still has ${productCount} product(s) assigned. Reassign them before deleting.`,
      )
    }

    await this.prisma.client.subcategory.delete({
      where: { slug: subSlug },
    })

    return { message: `Subcategory '${subcategory.name}' deleted successfully` }
  }
}
