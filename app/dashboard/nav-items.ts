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

export type DashboardNavItem = {
  href: string
  icon: LucideIcon
  label: string
}

export function getDashboardNavItems(
  role?: 'superAdmin' | 'admin',
): DashboardNavItem[] {
  return [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/dashboard/events', icon: Calendar, label: 'Events' },
    { href: '/dashboard/courses', icon: BookOpen, label: 'Courses' },
    { href: '/dashboard/news', icon: Newspaper, label: 'News' },
    { href: '/dashboard/gallery', icon: Images, label: 'Gallery' },
    { href: '/dashboard/schools', icon: School, label: 'Schools' },
    { href: '/dashboard/robofest', icon: Trophy, label: 'Robofest' },
    { href: '/dashboard/certificates', icon: Award, label: 'Certificates' },
    ...(role === 'superAdmin'
      ? [{ href: '/dashboard/members', icon: Users, label: 'Members' }]
      : []),
    { href: '/dashboard/profile', icon: User, label: 'Profile' },
  ]
}

export function isDashboardNavActive(pathname: string, href: string): boolean {
  return (
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
  )
}
