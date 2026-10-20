'use client'

import AdminGuard from '@/components/admin-guard'
import AppSidebar from '@/components/app-sidebar'
import AdminTopbar from '@/components/admin-topbar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

/**
 * Guarded shell for all admin pages: the shadcn sidebar + inset layout with a
 * sticky topbar, wrapped in AdminGuard (auth + admin role enforcement).
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <AdminTopbar />
          <div className="flex flex-1 flex-col gap-6 p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </AdminGuard>
  )
}
