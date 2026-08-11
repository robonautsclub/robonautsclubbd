'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, Sparkles } from 'lucide-react'
import { SITE_CONFIG } from '@/lib/site-config'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import Sidebar from './Sidebar'
import {
  getDashboardNavItems,
  isDashboardNavActive,
} from './nav-items'
import type { DashboardPermission, DashboardRole } from '@/lib/dashboard-permissions'

const COLLAPSED_STORAGE_KEY = 'dashboard-sidebar-collapsed'

type DashboardShellProps = {
  role?: DashboardRole
  permissions?: DashboardPermission[]
  userName: string
  userEmail: string
  headerActions: ReactNode
  children: ReactNode
}

export default function DashboardShell({
  role,
  permissions,
  userName,
  userEmail,
  headerActions,
  children,
}: DashboardShellProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navItems = getDashboardNavItems(role, permissions)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(COLLAPSED_STORAGE_KEY)
      if (stored === '1') setCollapsed(true)
    } catch {
      // ignore storage errors
    }
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(COLLAPSED_STORAGE_KEY, next ? '1' : '0')
      } catch {
        // ignore storage errors
      }
      return next
    })
  }

  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-linear-to-br from-slate-50 to-cyan-50/40">
      <nav className="shrink-0 bg-white/95 backdrop-blur border-b border-slate-200 z-20">
        <div className="px-3 sm:px-4 lg:px-6 xl:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="lg:hidden shrink-0 text-slate-600"
                    aria-label="Open navigation menu"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="w-[min(20rem,85vw)] p-0 flex flex-col gap-0"
                >
                  <SheetHeader className="px-4 py-3 border-b border-slate-100 text-left">
                    <SheetTitle>Navigation</SheetTitle>
                  </SheetHeader>
                  <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                    {navItems.map((item) => {
                      const Icon = item.icon
                      const isActive = isDashboardNavActive(pathname, item.href)
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          prefetch={false}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                            isActive
                              ? 'bg-cyan-50 text-cyan-800'
                              : 'text-slate-700 hover:bg-slate-50',
                          )}
                          aria-current={isActive ? 'page' : undefined}
                        >
                          <Icon
                            className={cn(
                              'h-5 w-5 shrink-0',
                              isActive ? 'text-cyan-700' : 'text-slate-500',
                            )}
                          />
                          {item.label}
                        </Link>
                      )
                    })}
                  </nav>
                </SheetContent>
              </Sheet>

              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-linear-to-br from-cyan-600 to-slate-800 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                  Admin Dashboard
                </h1>
                <p className="text-xs text-slate-500 hidden sm:block truncate">
                  {SITE_CONFIG.name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              <div className="hidden sm:block text-right">
                <p className="text-xs sm:text-sm font-medium text-slate-900 truncate max-w-[120px] sm:max-w-[200px]">
                  {userName}
                </p>
                <p className="text-xs text-slate-500 truncate max-w-[120px] sm:max-w-[200px]">
                  {userEmail}
                </p>
              </div>
              {headerActions}
            </div>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 min-h-0 w-full min-w-0 flex-col lg:flex-row">
        <Sidebar
          role={role}
          permissions={permissions}
          collapsed={collapsed}
          onToggleCollapsed={toggleCollapsed}
        />
        <main className="flex-1 min-h-0 min-w-0 w-full p-3 sm:p-5 lg:p-6 xl:p-8 overflow-y-auto overflow-x-hidden">
          <div className="w-full min-w-0 max-w-full">{children}</div>
        </main>
      </div>
    </div>
  )
}
