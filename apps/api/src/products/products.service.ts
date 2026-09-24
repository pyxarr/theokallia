import {
    Injectable,
    ConflictException,
    NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateProductDto } from './dto/create-product.dto'
import { UpdateProductDto } from './dto/update-product.dto'
import { FilterProductsDto } from './dto/filter-products.dto'

@Injectable()
export class ProductsService {
    constructor(private readonly prisma: PrismaService) { }

    // Public

    async findAll(filters: FilterProductsDto) {
        const {
            category,
            sort,
            order = 'desc',
            minPrice,
            maxPrice,
            page = 1,
            limit = 12,
        } = filters

        // calculate how many records to skip for pagination
        // e.g. page 2, limit 12 → skip 12
        const skip = (page - 1) * limit

        // build the where clause dynamically — only add conditions for filters that were passed
        const where: Record<string, unknown> = {}

        // handle multiple categories — split comma separated string into an array
        // e.g. ?category=rings,bracelets → slugs = ['rings', 'bracelets']
        // if only one category is passed it still works — array of one
        if (category) {
            const slugs = category.split(',').map((s) => s.trim())
            where.category = { slug: { in: slugs } }
        }

        // filter by price range — apply lower and/or upper bound if provided
        // user can pass just minPrice, just maxPrice, or both
        if (minPrice !== undefined || maxPrice !== undefined) {
            where.price = {
                ...(minPrice !== undefined && { gte: minPrice }),
                ...(maxPrice !== undefined && { lte: maxPrice }),
            }
        }

        // build the orderBy clause based on sort + order params
        // default is createdAt desc — newest products first — when no sort is selected
        let orderBy: Record<string, unknown> = { createdAt: order }

        if (sort === 'new-arrival') {
            // new arrivals — sort by creation date in the requested direction
            orderBy = { createdAt: order }
        }

        if (sort === 'best-seller') {
            // best sellers — sort by number of times the product has been ordered
            // _count.orderItems gives us the total number of order items for each product
            orderBy = { orderItems: { _count: order } }
        }

        // run both queries in parallel — products for this page + total count for pagination
        const [products, total] = await Promise.all([
            this.prisma.client.product.findMany({
                where,
                orderBy,
                skip,
                take: limit,
                include: {
                    // include category and subcategory names for display on product cards
                    category: { select: { name: true, slug: true } },
                    subcategory: { select: { name: true, slug: true } },
                },
            }),
            this.prisma.client.product.count({ where }),
        ])

        // batch-fetch assets for all products on this page to avoid N+1
        const ids = products.map((p) => p.id)
        const assets = await this.prisma.client.asset.findMany({
            where: { entityType: 'Product', entityId: { in: ids } },
            orderBy: { sortOrder: 'asc' },
        })
        const assetMap = new Map<string, typeof assets>()
        for (const asset of assets) {
            const group = assetMap.get(asset.entityId) ?? []
            group.push(asset)
            assetMap.set(asset.entityId, group)
        }
        const productsWithAssets = products.map((p) => ({
            ...p,
            assets: assetMap.get(p.id) ?? [],
        }))

        return {
            data: productsWithAssets,
            meta: {
                total,
                page,
                limit,
                // ceil so a partial last page is still counted as a full page
                totalPages: Math.ceil(total / limit),
            },
        }
    }

    async findOneBySlug(slug: string) {
        const product = await this.prisma.client.product.findUnique({
            where: { slug },
            include: {
                category: { select: { name: true, slug: true } },
                subcategory: { select: { name: true, slug: true } },
                // include reviews so the product detail page can show ratings and review cards
                reviews: {
                    where: { status: 'approved' },
                    include: {
                        // include reviewer name to display on each review card
                        user: { select: { firstName: true, lastName: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                },
            },
        })

        if (!product) {
            throw new NotFoundException(`Product '${slug}' not found`)
        }

        // fetch assets polymorphically — entityType + entityId links them to this product
        const assets = await this.prisma.client.asset.findMany({
            where: { entityType: 'Product', entityId: product.id },
            orderBy: { sortOrder: 'asc' },
        })

        // compute rating stats from reviews instead of storing them on the product
        // this keeps the DB as the single source of truth
        const rating = this.computeRating(product.reviews)

        return { ...product, assets, ...rating }
    }

    async findSimilar(slug: string) {
        // get the product first so we know its category
        const product = await this.prisma.client.product.findUnique({
            where: { slug },
            select: { categoryId: true, id: true },
        })

        if (!product) {
            throw new NotFoundException(`Product '${slug}' not found`)
        }

        // return 3 products from the same category, excluding the current product
        const similar = await this.prisma.client.product.findMany({
            where: {
                categoryId: product.categoryId,
                id: { not: product.id },
            },
            take: 3,
            include: {
                category: { select: { name: true, slug: true } },
                subcategory: { select: { name: true, slug: true } },
            },
            orderBy: { createdAt: 'desc' },
        })

        // batch-fetch assets for all similar products to avoid N+1
        const ids = similar.map((p) => p.id)
        const assets = await this.prisma.client.asset.findMany({
            where: { entityType: 'Product', entityId: { in: ids } },
            orderBy: { sortOrder: 'asc' },
        })

        const assetMap = new Map<string, typeof assets>()
        for (const asset of assets) {
            const group = assetMap.get(asset.entityId) ?? []
            group.push(asset)
            assetMap.set(asset.entityId, group)
        }

        return similar.map((p) => ({
            ...p,
            assets: assetMap.get(p.id) ?? [],
        }))
    }

    // Admin

    async create(dto: CreateProductDto) {
        // prevent duplicate slugs
        const existing = await this.prisma.client.product.findUnique({
            where: { slug: dto.slug },
        })

        if (existing) {
            throw new ConflictException(`A product with slug '${dto.slug}' already exists`)
        }

        // resolve categoryId from the slug passed in the DTO
        const category = await this.prisma.client.category.findUnique({
            where: { slug: dto.categorySlug },
        })

        if (!category) {
            throw new NotFoundException(`Category '${dto.categorySlug}' not found`)
        }

        // resolve subcategoryId if a subcategory slug was provided
        let subcategoryId: string | undefined
        if (dto.subcategorySlug) {
            const subcategory = await this.prisma.client.subcategory.findUnique({
                where: { slug: dto.subcategorySlug },
            })

            if (!subcategory) {
                throw new NotFoundException(`Subcategory '${dto.subcategorySlug}' not found`)
            }

            subcategoryId = subcategory.id
        }

        const created = await this.prisma.client.product.create({
            data: {
                name: dto.name,
                slug: dto.slug,
                description: dto.description,
                price: dto.price,
                usdPrice: dto.usdPrice,
                gbpPrice: dto.gbpPrice,
                inStock: dto.inStock ?? true,
                stock: dto.stock,
                categoryId: category.id,
                subcategoryId,
            },
            include: {
                category: { select: { name: true, slug: true } },
                subcategory: { select: { name: true, slug: true } },
            },
        })

        // if publicIds were passed, create asset records for them
        if (dto.images && dto.images.length > 0) {
            await this.prisma.client.asset.createMany({
                data: dto.images.map((publicId, i) => ({
                    publicId,
                    altText: `${created.name} image ${i + 1}`,
                    sortOrder: i,
                    entityType: 'Product',
                    entityId: created.id,
                })),
            })
        }

        return created
    }

    async update(slug: string, dto: UpdateProductDto) {
        // confirm the product exists before updating
        await this.findOneBySlug(slug)

        // if slug is being changed, make sure the new slug is not taken
        if (dto.slug && dto.slug !== slug) {
            const slugTaken = await this.prisma.client.product.findUnique({
                where: { slug: dto.slug },
            })

            if (slugTaken) {
                throw new ConflictException(`A product with slug '${dto.slug}' already exists`)
            }
        }

        // resolve new categoryId if categorySlug is being updated
        let categoryId: string | undefined
        if (dto.categorySlug) {
            const category = await this.prisma.client.category.findUnique({
                where: { slug: dto.categorySlug },
            })

            if (!category) {
                throw new NotFoundException(`Category '${dto.categorySlug}' not found`)
            }

            categoryId = category.id
        }

        // resolve new subcategoryId if subcategorySlug is being updated
        let subcategoryId: string | undefined
        if (dto.subcategorySlug) {
            const subcategory = await this.prisma.client.subcategory.findUnique({
                where: { slug: dto.subcategorySlug },
            })

            if (!subcategory) {
                throw new NotFoundException(`Subcategory '${dto.subcategorySlug}' not found`)
            }

            subcategoryId = subcategory.id
        }

        const updated = await this.prisma.client.product.update({
            where: { slug },
            data: {
                name: dto.name,
                slug: dto.slug,
                description: dto.description,
                price: dto.price,
                inStock: dto.inStock,
                stock: dto.stock,
                ...(dto.usdPrice !== undefined && { usdPrice: dto.usdPrice }),
                ...(dto.gbpPrice !== undefined && { gbpPrice: dto.gbpPrice }),
                ...(categoryId && { categoryId }),
                ...(subcategoryId && { subcategoryId }),
            },
            include: {
                category: { select: { name: true, slug: true } },
                subcategory: { select: { name: true, slug: true } },
            },
        })

        // if images were provided, replace existing assets with new ones
        if (dto.images) {
            await this.prisma.client.asset.deleteMany({
                where: { entityType: 'Product', entityId: updated.id },
            })

            await this.prisma.client.asset.createMany({
                data: dto.images.map((publicId, i) => ({
                    publicId,
                    altText: `${updated.name} image ${i + 1}`,
                    sortOrder: i,
                    entityType: 'Product',
                    entityId: updated.id,
                })),
            })
        }

        return updated
    }

    async delete(slug: string) {
        // confirm the product exists before deleting
        await this.findOneBySlug(slug)

        await this.prisma.client.product.delete({
            where: { slug },
        })

        return { message: `Product '${slug}' deleted successfully` }
    }

    // ─── Helpers ───────────────────────────────────────────────────────────────

    // computes average rating and star breakdown from the reviews array
    // called on findOneBySlug — never stored in the DB
    private computeRating(reviews: { rating: number }[]) {
        const reviewCount = reviews.length

        if (reviewCount === 0) {
            return {
                rating: 0,
                reviewCount: 0,
                ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
            }
        }

        const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<number, number>
        let total = 0

        for (const review of reviews) {
            breakdown[review.rating] = (breakdown[review.rating] ?? 0) + 1
            total += review.rating
        }

        return {
            // round to 1 decimal place e.g. 4.8
            rating: Math.round((total / reviewCount) * 10) / 10,
            reviewCount,
            ratingBreakdown: breakdown,
        }
    }
}