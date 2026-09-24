'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Star,
  Tags,
  Users,
  Megaphone,
  Ticket,
  Mail,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'

interface NavItem {
  title: string
  href: string
  icon: LucideIcon
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Catalog',
    items: [
      { title: 'Products', href: '/products', icon: Package },
      { title: 'Categories', href: '/categories', icon: Tags },
      { title: 'Orders', href: '/orders', icon: ShoppingCart },
      { title: 'Reviews', href: '/reviews', icon: Star },
    ],
  },
  {
    label: 'Customers',
    items: [
      { title: 'Customers', href: '/customers', icon: Users },
      { title: 'Newsletter', href: '/newsletter', icon: Mail },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { title: 'Content', href: '/content', icon: Megaphone },
      { title: 'Coupons', href: '/coupons', icon: Ticket },
    ],
  },
  {
    label: 'System',
    items: [{ title: 'Settings', href: '/settings', icon: Settings }],
  },
]

/** Primary navigation sidebar built on the shadcn Sidebar primitive. */
export default function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center bg-[#7E22CE] text-sm font-semibold text-white">
                  T
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-le-jour tracking-wide uppercase">
                    Theokallia
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    Admin
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname.startsWith(item.href)}
                      tooltip={item.title}
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Back to storefront">
              <a
                href={process.env.NEXT_PUBLIC_APP_URL ?? '#'}
                target="_blank"
                rel="noreferrer"
              >
                <Mail />
                <span>View Storefront</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
