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

const COLLAPSED_STORAGE_KEY = 'dashboard-sidebar-collapsed'

type DashboardShellProps = {
  role?: 'superAdmin' | 'admin'
  userName: string
  userEmail: string
  headerActions: ReactNode
  children: ReactNode
}

export default function DashboardShell({
  role,
  userName,
  userEmail,
  headerActions,
  children,
}: DashboardShellProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navItems = getDashboardNavItems(role)

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
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-20">
        <div className="px-3 sm:px-4 lg:px-6 xl:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="lg:hidden shrink-0"
                    aria-label="Open navigation menu"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="w-[min(20rem,85vw)] p-0 flex flex-col gap-0"
                >
                  <SheetHeader className="px-4 py-3 border-b border-gray-100 text-left">
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
                              ? 'bg-indigo-50 text-indigo-600'
                              : 'text-gray-700 hover:bg-gray-50',
                          )}
                          aria-current={isActive ? 'page' : undefined}
                        >
                          <Icon
                            className={cn(
                              'h-5 w-5 shrink-0',
                              isActive ? 'text-indigo-600' : 'text-gray-500',
                            )}
                          />
                          {item.label}
                        </Link>
                      )
                    })}
                  </nav>
                </SheetContent>
              </Sheet>

              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-linear-to-br from-indigo-500 to-blue-600 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                  Admin Dashboard
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block truncate">
                  {SITE_CONFIG.name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              <div className="hidden sm:block text-right">
                <p className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-[200px]">
                  {userName}
                </p>
                <p className="text-xs text-gray-500 truncate max-w-[120px] sm:max-w-[200px]">
                  {userEmail}
                </p>
              </div>
              {headerActions}
            </div>
          </div>
        </div>
      </nav>

      <div className="flex flex-col lg:flex-row w-full min-w-0">
        <Sidebar
          role={role}
          collapsed={collapsed}
          onToggleCollapsed={toggleCollapsed}
        />
        <main className="flex-1 min-w-0 w-full p-3 sm:p-5 lg:p-6 xl:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
