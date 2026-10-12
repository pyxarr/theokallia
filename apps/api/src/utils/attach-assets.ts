import { PrismaClient, Asset } from '@prisma/client'

/**
 * Fetches polymorphic assets for the given product IDs and returns a map
 * of productId -> Asset[]. Shared by CartService and OrdersService.
 */
export async function fetchProductAssets(
  prisma: PrismaClient,
  productIds: string[]
): Promise<Map<string, Asset[]>> {
  const uniqueIds = [...new Set(productIds)]
  if (uniqueIds.length === 0) return new Map()

  const assets = await prisma.asset.findMany({
    where: { entityType: 'Product', entityId: { in: uniqueIds } },
    orderBy: { sortOrder: 'asc' },
  })

  const map = new Map<string, Asset[]>()
  for (const asset of assets) {
    const group = map.get(asset.entityId) ?? []
    group.push(asset)
    map.set(asset.entityId, group)
  }

  return map
}