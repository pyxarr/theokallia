import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import api from '@/lib/api'

export type SubscriberTag = 'guest' | 'registered' | 'vip'
export type NewsletterTab = 'all' | 'inactive' | SubscriberTag

export interface AdminSubscriber {
  id: string
  email: string
  userId: string | null
  tags: SubscriberTag[]
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface AdminSubscriberFilters {
  tab: NewsletterTab
  q?: string
  limit?: number
}

export interface AdminSubscriberCounts {
  total: number
  active: number
  inactive: number
  guest: number
  registered: number
  vip: number
}

interface AdminSubscribersPage {
  data: AdminSubscriber[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

/** Maps a tab to the API query — the single source of truth for tab semantics. */
const tabToParams = (tab: NewsletterTab, q?: string) => {
  const params = new URLSearchParams()
  if (tab === 'inactive') params.set('active', 'false')
  else if (tab !== 'all') params.set('tag', tab)
  if (q) params.set('q', q)
  return params
}

const fetchAdminSubscribers = async (
  filters: AdminSubscriberFilters,
  page: number
): Promise<AdminSubscribersPage> => {
  const params = tabToParams(filters.tab, filters.q)
  if (filters.limit) params.set('limit', String(filters.limit))
  params.set('page', String(page))

  const res = await api.get(`/subscribers?${params.toString()}`)
  return res.data
}

const fetchAdminSubscriberCounts = async (): Promise<AdminSubscriberCounts> => {
  const res = await api.get('/subscribers/counts')
  return res.data
}

const setSubscriberActive = async ({
  email,
  active,
}: {
  email: string
  active: boolean
}): Promise<AdminSubscriber> => {
  const res = await api.patch(`/subscribers/${encodeURIComponent(email)}`, {
    active,
  })
  return res.data
}

/** Newsletter directory — Load More pagination with tab and search filters. */
export const useAdminSubscribers = (filters: AdminSubscriberFilters) => {
  return useInfiniteQuery({
    queryKey: ['admin', 'newsletter', JSON.stringify(filters)],
    queryFn: ({ pageParam }) => fetchAdminSubscribers(filters, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.meta
      return page < totalPages ? page + 1 : undefined
    },
    staleTime: 1000 * 30,
  })
}

/** Active, inactive, and per-tag totals for the tab badges. */
export const useAdminSubscriberCounts = () => {
  return useQuery({
    queryKey: ['admin', 'newsletter', 'counts'],
    queryFn: fetchAdminSubscriberCounts,
    staleTime: 1000 * 30,
  })
}

export const useSetSubscriberActive = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: setSubscriberActive,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'newsletter'] })
    },
  })
}
