'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { SiteConfig, ShippingZone } from '@theokallia/types'

export type { SiteConfig, ShippingZone } from '@theokallia/types'

/**
 * The only fields the PATCH /site-config body accepts.
 * Kept separate from SiteConfig on purpose: the API validates request
 * bodies with `forbidNonWhitelisted`, so sending `id` or `updatedAt`
 * back would be rejected with a 400.
 */
export interface SiteConfigInput {
  vipOrderThreshold?: number
  vipSpendThreshold?: number
  welcomeDiscountPercent?: number
  welcomeDiscountMinOrder?: number
  welcomeDiscountExpiry?: number
}

/**
 * The only fields the shipping-zone write endpoints accept.
 * Kept separate from ShippingZone for the same reason as SiteConfigInput.
 */
export interface ShippingZoneInput {
  name?: string
  rate?: number
  active?: boolean
}

/**
 * The POST /shipping-zones body. `active` is optional — the API defaults
 * it to `true` when it is left out, so a zone created without it is
 * published to customers straight away.
 */
export interface CreateShippingZoneInput {
  name: string
  rate: number
  active?: boolean
}

/** The cache key the shipping-zone list lives under. */
const SHIPPING_ZONES_QUERY_KEY = ['admin', 'shipping-zones'] as const

/** The cache key the global settings row lives under. */
const SITE_CONFIG_QUERY_KEY = ['admin', 'site-config'] as const

// Fetchers

const fetchSiteConfig = async (): Promise<SiteConfig> => {
  const res = await api.get<SiteConfig>('/site-config')
  return res.data
}

const fetchShippingZones = async (): Promise<ShippingZone[]> => {
  const res = await api.get<ShippingZone[]>('/shipping-zones/admin')
  return res.data
}

const updateSiteConfig = async (input: SiteConfigInput): Promise<SiteConfig> => {
  const res = await api.patch<SiteConfig>('/site-config', input)
  return res.data
}

const updateShippingZone = async ({
  id,
  input,
}: {
  id: string
  input: ShippingZoneInput
}): Promise<ShippingZone> => {
  const res = await api.patch<ShippingZone>(`/shipping-zones/${id}`, input)
  return res.data
}

const createShippingZone = async (
  input: CreateShippingZoneInput
): Promise<ShippingZone> => {
  const res = await api.post<ShippingZone>('/shipping-zones', input)
  return res.data
}

// Hooks

/** The global store settings — VIP thresholds and welcome-discount terms. */
export const useSiteConfig = () => {
  return useQuery({
    queryKey: SITE_CONFIG_QUERY_KEY,
    queryFn: fetchSiteConfig,
    staleTime: 1000 * 30,
  })
}

/** Every shipping zone, active and inactive. */
export const useShippingZones = () => {
  return useQuery({
    queryKey: SHIPPING_ZONES_QUERY_KEY,
    queryFn: fetchShippingZones,
    staleTime: 1000 * 30,
  })
}

export const useUpdateSiteConfig = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateSiteConfig,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SITE_CONFIG_QUERY_KEY })
    },
  })
}

export const useUpdateShippingZone = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateShippingZone,
    // The `active` toggle has to feel instant, so the new value goes into
    // the cache before the request goes out. A failed save puts the
    // previous value back, and the refetch lets the server's value win.
    onMutate: async ({ id, input }) => {
      const active = input.active
      await queryClient.cancelQueries({ queryKey: SHIPPING_ZONES_QUERY_KEY })
      const previous = queryClient.getQueryData<ShippingZone[]>(
        SHIPPING_ZONES_QUERY_KEY
      )
      queryClient.setQueryData<ShippingZone[]>(
        SHIPPING_ZONES_QUERY_KEY,
        (zones) =>
          zones?.map((zone) =>
            zone.id === id && active !== undefined
              ? { ...zone, active }
              : zone
          )
      )
      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(SHIPPING_ZONES_QUERY_KEY, context.previous)
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: SHIPPING_ZONES_QUERY_KEY })
    },
  })
}

export const useCreateShippingZone = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createShippingZone,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SHIPPING_ZONES_QUERY_KEY })
    },
  })
}
