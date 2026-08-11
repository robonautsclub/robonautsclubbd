import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  Users,
  User,
  Newspaper,
  Images,
  School,
  Trophy,
  Award,
  type LucideIcon,
} from 'lucide-react'
import type {
  DashboardArea,
  DashboardPermission,
  DashboardRole,
} from '@/lib/dashboard-permissions'
import {
  canViewTab,
  type PermissionSession,
} from '@/lib/dashboard-permissions'

export type DashboardNavItem = {
  href: string
  icon: LucideIcon
  label: string
  area?: DashboardArea
}

const AREA_ITEMS: Array<{
  href: string
  icon: LucideIcon
  label: string
  area: DashboardArea
}> = [
  { href: '/dashboard/events', icon: Calendar, label: 'Events', area: 'events' },
  { href: '/dashboard/courses', icon: BookOpen, label: 'Courses', area: 'courses' },
  { href: '/dashboard/news', icon: Newspaper, label: 'News', area: 'news' },
  { href: '/dashboard/gallery', icon: Images, label: 'Gallery', area: 'gallery' },
  { href: '/dashboard/schools', icon: School, label: 'Schools', area: 'schools' },
  { href: '/dashboard/robofest', icon: Trophy, label: 'Robofest', area: 'robofest' },
  {
    href: '/dashboard/certificates',
    icon: Award,
    label: 'Certificates',
    area: 'certificates',
  },
  { href: '/dashboard/members', icon: Users, label: 'Members', area: 'members' },
]

export function getDashboardNavItems(
  role?: DashboardRole,
  permissions?: DashboardPermission[],
): DashboardNavItem[] {
  const session: PermissionSession = {
    role: role || 'admin',
    permissions: permissions || [],
  }

  const items: DashboardNavItem[] = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  ]

  for (const item of AREA_ITEMS) {
    if (canViewTab(session, item.area)) {
      items.push(item)
    }
  }

  items.push({ href: '/dashboard/profile', icon: User, label: 'Profile' })
  return items
}

export function isDashboardNavActive(pathname: string, href: string): boolean {
  return (
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
  )
}
