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

const createShippingZone = async (input: {
  name: string
  rate: number
}): Promise<ShippingZone> => {
  const res = await api.post<ShippingZone>('/shipping-zones', input)
  return res.data
}

// Hooks

/** The global store settings — VIP thresholds and welcome-discount terms. */
export const useSiteConfig = () => {
  return useQuery({
    queryKey: ['admin', 'site-config'],
    queryFn: fetchSiteConfig,
    staleTime: 1000 * 30,
  })
}

/** Every shipping zone, active and inactive. */
export const useShippingZones = () => {
  return useQuery({
    queryKey: ['admin', 'shipping-zones'],
    queryFn: fetchShippingZones,
    staleTime: 1000 * 30,
  })
}

export const useUpdateSiteConfig = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateSiteConfig,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'site-config'] })
    },
  })
}

export const useUpdateShippingZone = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateShippingZone,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'shipping-zones'] })
    },
  })
}

export const useCreateShippingZone = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createShippingZone,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'shipping-zones'] })
    },
  })
}
