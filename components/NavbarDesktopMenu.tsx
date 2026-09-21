'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

type SubLink = { title: string; href: string }
type MenuItem = { title: string; href?: string; subLinks?: SubLink[] }

const normalize = (s = '') =>
  s.split('#')[0].split('?')[0].replace(/\/+$/, '') || '/'

const isActive = (href?: string, current?: string) => {
  if (!href) return false
  const p = normalize(current ?? '')
  const h = normalize(href)
  if (h === '/') return p === '/'
  return p === h || p.startsWith(h + '/')
}

/** Desktop nav with active state — isolated client island. */
export default function NavbarDesktopMenu({ menuItems }: { menuItems: readonly MenuItem[] }) {
  const pathname = usePathname()

  return (
    <div className="hidden lg:block">
      <ul className="flex items-center gap-2 text-[15px]">
        {menuItems.map((item, idx) => {
          const active = isActive(item.href, pathname)
          const sectionActive = item.subLinks?.some((s) => isActive(s.href, pathname))

          if (item.subLinks) {
            return (
              <li key={idx} className="relative">
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        'flex items-center gap-2 py-2 px-3 rounded-lg transition-colors font-medium',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200',
                        '[&[data-state=open]>svg]:rotate-180',
                        sectionActive
                          ? 'text-indigo-700 bg-indigo-400'
                          : 'text-gray-700 hover:text-indigo-700 hover:bg-blue-200',
                      )}
                    >
                      <span>{item.title}</span>
                      <ChevronDown className="size-4 transition-transform" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    sideOffset={8}
                    className="w-56 p-2 rounded-xl bg-white shadow-lg ring-1 ring-indigo-100/70 border-0"
                  >
                    <ul className="text-gray-800">
                      {item.subLinks.map((sub, sIdx) => {
                        const subActive = isActive(sub.href, pathname)
                        return (
                          <li key={sIdx}>
                            <Link
                              href={sub.href}
                              prefetch={false}
                              className={cn(
                                'block px-3 py-2 rounded-md text-sm transition-colors no-underline hover:no-underline focus:no-underline',
                                subActive
                                  ? 'text-indigo-700 bg-sky-100'
                                  : 'hover:bg-sky-100 hover:text-indigo-700',
                              )}
                            >
                              {sub.title}
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  </PopoverContent>
                </Popover>
              </li>
            )
          }

          return (
            <li key={idx}>
              <Link
                href={item.href as string}
                prefetch={false}
                className={cn(
                  'py-2 px-3 font-medium rounded-lg transition-colors no-underline hover:no-underline focus:no-underline',
                  active
                    ? 'text-indigo-700 bg-blue-200'
                    : 'text-gray-700 hover:text-indigo-700 hover:bg-sky-200',
                )}
                aria-current={active ? 'page' : undefined}
              >
                {item.title}
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
