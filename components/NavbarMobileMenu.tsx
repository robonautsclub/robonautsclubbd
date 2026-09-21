'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { ChevronDown, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

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

export default function NavbarMobileMenu({ menuItems }: { menuItems: readonly MenuItem[] }) {
  const pathname = usePathname()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [mobileOpenIdx, setMobileOpenIdx] = useState<number | null>(null)

  const handleDrawerOpenChange = (open: boolean) => {
    setIsDrawerOpen(open)
    if (!open) setMobileOpenIdx(null)
    window.dispatchEvent(new CustomEvent('nav-drawer', { detail: { open } }))
  }

  return (
    <Sheet open={isDrawerOpen} onOpenChange={handleDrawerOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden size-11 text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
          aria-label="Open main menu"
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-4/5 max-w-sm bg-blue-50 p-0 flex flex-col gap-0"
      >
        <SheetHeader className="px-4 py-3 sticky top-0 bg-blue-100/95 backdrop-blur border-b border-blue-200/60 z-10">
          <SheetTitle className="text-gray-900">Menu</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          <nav className="grid gap-2" aria-label="Mobile navigation">
            {menuItems.map((item, idx) => (
              <div key={idx}>
                {item.subLinks ? (
                  <Collapsible
                    open={mobileOpenIdx === idx}
                    onOpenChange={(open) => setMobileOpenIdx(open ? idx : null)}
                  >
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          'flex w-full items-center justify-between p-2 text-sm font-medium rounded-lg hover:bg-indigo-50 text-gray-900',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200',
                        )}
                      >
                        <span>{item.title}</span>
                        <ChevronDown
                          className={cn(
                            'size-4 transition-transform',
                            mobileOpenIdx === idx && 'rotate-180',
                          )}
                        />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="ml-3 overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                      {item.subLinks.map((sub, sIdx) => {
                        const activeSub = isActive(sub.href, pathname)
                        return (
                          <Link
                            key={sIdx}
                            href={sub.href}
                            prefetch={false}
                            onClick={() => handleDrawerOpenChange(false)}
                            className={cn(
                              'block p-2 text-sm rounded-md no-underline hover:no-underline focus:no-underline',
                              activeSub
                                ? 'text-indigo-700 bg-indigo-50'
                                : 'text-gray-800 hover:bg-indigo-50 hover:text-indigo-700',
                            )}
                            aria-current={activeSub ? 'page' : undefined}
                          >
                            {sub.title}
                          </Link>
                        )
                      })}
                    </CollapsibleContent>
                  </Collapsible>
                ) : (
                  <Link
                    href={item.href as string}
                    prefetch={false}
                    onClick={() => handleDrawerOpenChange(false)}
                    className={cn(
                      'block p-2 text-sm font-medium rounded-lg no-underline hover:no-underline focus:no-underline',
                      isActive(item.href, pathname)
                        ? 'text-indigo-700 bg-indigo-50'
                        : 'hover:bg-indigo-50 text-gray-900',
                    )}
                    aria-current={isActive(item.href, pathname) ? 'page' : undefined}
                  >
                    {item.title}
                  </Link>
                )}
                <Separator className="mt-2 bg-blue-200/40 last:hidden" />
              </div>
            ))}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  )
}
