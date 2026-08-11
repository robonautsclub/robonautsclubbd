'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import {
  getDashboardNavItems,
  isDashboardNavActive,
} from './nav-items'
import type { DashboardPermission, DashboardRole } from '@/lib/dashboard-permissions'

interface SidebarProps {
  role?: DashboardRole
  permissions?: DashboardPermission[]
  collapsed: boolean
  onToggleCollapsed: () => void
}

export default function Sidebar({
  role,
  permissions,
  collapsed,
  onToggleCollapsed,
}: SidebarProps) {
  const pathname = usePathname()
  const navItems = getDashboardNavItems(role, permissions)

  return (
    <aside
      className={cn(
        'hidden lg:flex lg:flex-col shrink-0 h-full bg-white border-r border-slate-200 transition-[width] duration-200 ease-in-out overflow-hidden',
        collapsed ? 'lg:w-16' : 'lg:w-64',
      )}
    >
      <div
        className={cn(
          'flex items-center border-b border-slate-100 px-2 py-2 shrink-0',
          collapsed ? 'justify-center' : 'justify-between',
        )}
      >
        {!collapsed ? (
          <p className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Navigation
          </p>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-500 hover:text-slate-900"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <nav className="p-2 flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = isDashboardNavActive(pathname, item.href)

            const link = (
              <Link
                href={item.href}
                prefetch={false}
                className={cn(
                  'flex items-center rounded-lg transition-all font-medium text-sm',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200',
                  collapsed
                    ? 'justify-center px-2 py-2.5'
                    : 'gap-3 px-3 py-2.5',
                  isActive
                    ? 'bg-cyan-50 text-cyan-800 shadow-sm'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900',
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon
                  className={cn(
                    'w-5 h-5 shrink-0',
                    isActive ? 'text-cyan-700' : 'text-slate-500',
                  )}
                />
                {!collapsed ? <span>{item.label}</span> : null}
              </Link>
            )

            if (!collapsed) {
              return <div key={item.href}>{link}</div>
            }

            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            )
          })}
        </nav>
      </ScrollArea>
    </aside>
  )
}
