'use client'

import Link from 'next/link'
import Image from 'next/image'
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
      { title: 'Content', href: '/studio', icon: Megaphone },
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
            <SidebarMenuButton size="lg" render={<Link href="/dashboard" />}>
              <Image
                src="/logo.webp"
                alt="Theokallia Logo"
                width={180}
                height={200}
                // sizes="200px"
                priority
                className="object-contain"
              />
              {/* <div className="grid flex-1 text-left leading-tight">
                <span className="truncate font-le-jour tracking-wide uppercase">
                  Theokallia
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  Admin
                </span>
              </div> */}
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
                      render={<Link href={item.href} />}
                      isActive={pathname.startsWith(item.href)}
                      tooltip={item.title}
                    >
                      <item.icon />
                      <span>{item.title}</span>
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
            <SidebarMenuButton
              render={
                <a
                  href={process.env.NEXT_PUBLIC_APP_URL ?? '#'}
                  target="_blank"
                  rel="noreferrer"
                />
              }
              tooltip="Back to storefront"
            >
              <Mail />
              <span>View Storefront</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
