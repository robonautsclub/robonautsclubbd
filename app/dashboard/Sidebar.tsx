'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Calendar, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Sidebar() {
  const pathname = usePathname()

  const navItems = [
    {
      href: '/dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard',
    },
    {
      href: '/dashboard/events',
      icon: Calendar,
      label: 'Events',
    },
    {
      href: '/dashboard/courses',
      icon: BookOpen,
      label: 'Courses',
    },
  ]

  return (
    <aside className="w-full lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-gray-200 lg:min-h-[calc(100vh-4rem)] lg:sticky lg:top-16">
      <nav className="p-2 sm:p-4 flex lg:flex-col gap-1 lg:space-y-1 overflow-x-auto lg:overflow-x-visible">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-all font-medium whitespace-nowrap text-sm sm:text-base',
                isActive
                  ? 'bg-indigo-50 text-indigo-600 shadow-sm'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className={cn('w-4 h-4 sm:w-5 sm:h-5 shrink-0', isActive ? 'text-indigo-600' : 'text-gray-500')} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

