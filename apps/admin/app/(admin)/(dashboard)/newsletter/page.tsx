'use client'

import { useEffect, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  useAdminSubscribers,
  useAdminSubscriberCounts,
  useSetSubscriberActive,
  type AdminSubscriber,
  type NewsletterTab,
} from '@/lib/hooks/use-admin-subscribers'
import { errorMessage } from '@/lib/utils'

const tabs: { label: string; value: NewsletterTab }[] = [
  { label: 'All', value: 'all' },
  { label: 'Guests', value: 'guest' },
  { label: 'Registered', value: 'registered' },
  { label: 'VIP', value: 'vip' },
  { label: 'Archived', value: 'inactive' },
]

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function NewsletterPage() {
  const [tab, setTab] = useState<NewsletterTab>('all')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [toggling, setToggling] = useState<AdminSubscriber | null>(null)

  // debounce so typing doesn't fire a request per keystroke
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  const filters = debouncedSearch ? { tab, q: debouncedSearch } : { tab }
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useAdminSubscribers(filters)
  const { data: counts } = useAdminSubscriberCounts()
  const { mutateAsync: setActive, isPending: isUpdating } =
    useSetSubscriberActive()

  const subscribers = data?.pages.flatMap((page) => page.data) ?? []
  const totalCount = data?.pages[0]?.meta.total ?? 0
  const countFor = (value: NewsletterTab) =>
    value === 'all'
      ? counts?.total
      : value === 'inactive'
        ? counts?.inactive
        : counts?.[value]

  const handleToggle = async () => {
    if (!toggling) return
    const nextActive = !toggling.active
    try {
      await setActive({ email: toggling.email, active: nextActive })
      toast.success(
        nextActive ? 'Subscriber reactivated' : 'Subscriber archived'
      )
      setToggling(null)
    } catch (err) {
      toast.error(errorMessage(err, 'Update failed'))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-le-jour text-3xl tracking-wide uppercase">
            Newsletter
          </h1>
          <p className="text-sm text-muted-foreground">
            {totalCount} subscriber{totalCount === 1 ? '' : 's'}
            {debouncedSearch ? ` matching “${debouncedSearch}”` : ''}
          </p>
        </div>
        <Input
          placeholder="Search by email…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full sm:max-w-xs"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => {
          const count = countFor(item.value)
          return (
            <Button
              key={item.value}
              variant={tab === item.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTab(item.value)}
            >
              {item.label}
              {count !== undefined && (
                <Badge variant="secondary" className="ml-2">
                  {count}
                </Badge>
              )}
            </Button>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Audience</CardTitle>
          <CardDescription>
            Tags are lifecycle states — archived records keep their tags for
            history.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Subscribed</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground"
                  >
                    Loading subscribers…
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && subscribers.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground"
                  >
                    No subscribers in this list.
                  </TableCell>
                </TableRow>
              )}
              {subscribers.map((subscriber) => (
                <TableRow key={subscriber.id}>
                  <TableCell className="font-medium">
                    {subscriber.email}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {subscriber.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                      {subscriber.tags.length === 0 && (
                        <span className="text-xs text-muted-foreground">
                          none
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(subscriber.createdAt)}
                  </TableCell>
                  <TableCell>
                    {subscriber.active ? (
                      <Badge variant="outline">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Archived</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={
                        subscriber.active
                          ? 'Archive subscriber'
                          : 'Reactivate subscriber'
                      }
                      onClick={() => setToggling(subscriber)}
                    >
                      {subscriber.active ? (
                        <EyeOff className="size-4 text-destructive" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {hasNextPage && (
            <div className="mt-4 flex justify-center">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? 'Loading…' : 'Load more'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={toggling !== null}
        onOpenChange={(open) => !open && setToggling(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {toggling?.active
                ? 'Archive subscriber?'
                : 'Reactivate subscriber?'}
            </DialogTitle>
            <DialogDescription>
              {toggling?.active
                ? `“${toggling?.email}” will stop receiving newsletters and their Resend contact is marked unsubscribed. Their tag history is kept.`
                : `“${toggling?.email}” will receive newsletters again and their Resend contact is restored.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setToggling(null)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              variant={toggling?.active ? 'destructive' : 'default'}
              disabled={isUpdating}
              onClick={() => void handleToggle()}
            >
              {isUpdating
                ? 'Updating…'
                : toggling?.active
                  ? 'Archive'
                  : 'Reactivate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
