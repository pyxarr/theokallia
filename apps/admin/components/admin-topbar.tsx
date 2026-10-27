'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'

/** Sticky top bar: sidebar toggle, breadcrumb, and the account menu. */
export default function AdminTopbar() {
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const user = session?.user
  const displayName = user?.name ?? 'Admin'
  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const PAGE_LABELS: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/products': 'Products',
    '/categories': 'Categories',
    '/orders': 'Orders',
    '/reviews': 'Reviews',
    '/customers': 'Customers',
    '/newsletter': 'Newsletter',
    '/studio': 'Content',
    '/coupons': 'Coupons',
    '/settings': 'Settings',
  }

  const pathname = usePathname()
  const currentPage = PAGE_LABELS[pathname] ?? pathname.split('/').pop() ?? 'Dashboard'

  const handleLogout = async () => {
    await authClient.signOut()
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />

      <Breadcrumb className="hidden sm:block">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/dashboard" />}>
              Admin
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{currentPage}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-2">
        <Badge className="hidden bg-[#F3E8FF] text-[#7E22CE] sm:inline-flex">Admin</Badge>

        <DropdownMenu>
          <DropdownMenuTrigger className="h-9 gap-2 px-2 cursor-pointer flex items-center">
            <Avatar className="size-7">
              <AvatarFallback className="bg-[#7E22CE] text-xs text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-sm md:inline">{displayName}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="truncate">
                {user?.email ?? 'Signed in'}
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>Log Out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
