import { ConflictException, NotFoundException } from '@nestjs/common'
import { CategoriesService } from './categories.service'
import { PrismaService } from '../prisma/prisma.service'

/**
 * Unit tests for CategoriesService — focused on the delete guards that protect
 * referential integrity: deleting a category or subcategory that still owns
 * products must fail with a friendly 409, and category deletion must remove
 * empty subcategories first (no DB-level cascade).
 */
describe('CategoriesService', () => {
  const categoryDelegate = {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  }
  const subcategoryDelegate = {
    findUnique: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  }
  const productDelegate = { count: jest.fn() }
  const $transaction = jest.fn()
  const prisma = {
    client: {
      category: categoryDelegate,
      subcategory: subcategoryDelegate,
      product: productDelegate,
      $transaction,
    },
  }
  let service: CategoriesService

  const ringsCategory = {
    id: 'cat-1',
    name: 'Rings',
    slug: 'rings',
    subcategories: [
      {
        id: 'sub-1',
        name: 'Gold Rings',
        slug: 'gold-rings',
        categoryId: 'cat-1',
      },
    ],
  }

  beforeEach(() => {
    jest.resetAllMocks()
    service = new CategoriesService(prisma as unknown as PrismaService)
    $transaction.mockResolvedValue([{ count: 1 }, { id: 'cat-1' }])
    categoryDelegate.findUnique.mockResolvedValue(ringsCategory)
  })

  describe('createCategory', () => {
    it('rejects a duplicate slug with 409', async () => {
      await expect(
        service.createCategory({ name: 'Rings', slug: 'rings' }),
      ).rejects.toBeInstanceOf(ConflictException)
    })
  })

  describe('deleteCategory', () => {
    it('throws 404 when the category does not exist', async () => {
      categoryDelegate.findUnique.mockResolvedValueOnce(null)
      await expect(service.deleteCategory('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      )
    })

    it('blocks deletion when the category still has products', async () => {
      productDelegate.count.mockResolvedValueOnce(3).mockResolvedValueOnce(0)

      await expect(service.deleteCategory('rings')).rejects.toBeInstanceOf(
        ConflictException,
      )
      expect($transaction).not.toHaveBeenCalled()
    })

    it('blocks deletion when a subcategory still has products', async () => {
      productDelegate.count.mockResolvedValueOnce(0).mockResolvedValueOnce(2)

      await expect(service.deleteCategory('rings')).rejects.toBeInstanceOf(
        ConflictException,
      )
      expect($transaction).not.toHaveBeenCalled()
    })

    it('deletes empty subcategories before the category', async () => {
      productDelegate.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0)

      const result = await service.deleteCategory('rings')

      expect($transaction).toHaveBeenCalledTimes(1)
      expect(subcategoryDelegate.deleteMany).toHaveBeenCalledWith({
        where: { categoryId: 'cat-1' },
      })
      expect(categoryDelegate.delete).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
      })
      expect(result).toEqual({
        message: "Category 'Rings' deleted successfully",
      })
    })
  })

  describe('deleteSubcategory', () => {
    it('blocks deletion when products are assigned', async () => {
      subcategoryDelegate.findUnique.mockResolvedValueOnce(
        ringsCategory.subcategories[0],
      )
      productDelegate.count.mockResolvedValueOnce(1)

      await expect(
        service.deleteSubcategory('rings', 'gold-rings'),
      ).rejects.toBeInstanceOf(ConflictException)
      expect(subcategoryDelegate.delete).not.toHaveBeenCalled()
    })

    it('deletes when no products are assigned', async () => {
      subcategoryDelegate.findUnique.mockResolvedValueOnce(
        ringsCategory.subcategories[0],
      )
      productDelegate.count.mockResolvedValueOnce(0)
      subcategoryDelegate.delete.mockResolvedValueOnce(
        ringsCategory.subcategories[0],
      )

      const result = await service.deleteSubcategory('rings', 'gold-rings')

      expect(subcategoryDelegate.delete).toHaveBeenCalledWith({
        where: { slug: 'gold-rings' },
      })
      expect(result).toEqual({
        message: "Subcategory 'Gold Rings' deleted successfully",
      })
    })
  })
})
