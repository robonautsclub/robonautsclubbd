'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  Users,
  User,
  Newspaper,
  Images,
  School,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface SidebarProps {
  role?: 'superAdmin' | 'admin'
}

type NavItem = {
  href: string
  icon: LucideIcon
  label: string
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()

  const navItems: NavItem[] = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/dashboard/events', icon: Calendar, label: 'Events' },
    { href: '/dashboard/courses', icon: BookOpen, label: 'Courses' },
    { href: '/dashboard/news', icon: Newspaper, label: 'News' },
    { href: '/dashboard/gallery', icon: Images, label: 'Gallery' },
    { href: '/dashboard/schools', icon: School, label: 'Schools' },
    ...(role === 'superAdmin'
      ? [{ href: '/dashboard/members', icon: Users, label: 'Members' }]
      : []),
    { href: '/dashboard/profile', icon: User, label: 'Profile' },
  ]

  return (
    <aside className="w-full lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-gray-200 lg:min-h-[calc(100vh-4rem)] lg:sticky lg:top-16">
      <ScrollArea className="lg:h-[calc(100vh-4rem)]">
        <nav className="p-2 sm:p-4 flex lg:flex-col gap-1 lg:space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))

            const link = (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                className={cn(
                  'flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-all font-medium whitespace-nowrap text-sm sm:text-base',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200',
                  isActive
                    ? 'bg-indigo-50 text-indigo-600 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon
                  className={cn(
                    'w-4 h-4 sm:w-5 sm:h-5 shrink-0',
                    isActive ? 'text-indigo-600' : 'text-gray-500'
                  )}
                />
                <span>{item.label}</span>
              </Link>
            )

            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right" className="lg:block hidden">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            )
          })}
        </nav>
        <ScrollBar orientation="horizontal" className="lg:hidden" />
      </ScrollArea>
    </aside>
  )
}
