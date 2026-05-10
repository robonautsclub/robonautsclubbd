'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'
import { ChevronDown, Menu } from 'lucide-react'
import { SITE_CONFIG } from '@/lib/site-config'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
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

export default function Nav() {
  const pathname = usePathname()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [mobileOpenIdx, setMobileOpenIdx] = useState<number | null>(null)
  const [isVisible, setIsVisible] = useState(true)

  const lastScrollY = useRef(0)

  const menuItems: readonly MenuItem[] = SITE_CONFIG.navLinks

  // Prevent horizontal overflow on all screens
  useEffect(() => {
    document.documentElement.classList.add('overflow-x-clip')
    return () => {
      document.documentElement.classList.remove('overflow-x-clip')
    }
  }, [])

  // Hide navbar on scroll down, show on scroll up or near top
  useEffect(() => {
    const onScroll = () => {
      if (isDrawerOpen) return
      const scrollY = window.scrollY
      if (scrollY <= 50) {
        setIsVisible(true)
      } else if (scrollY > lastScrollY.current + 10) {
        setIsVisible(false)
      } else if (scrollY < lastScrollY.current - 10) {
        setIsVisible(true)
      }
      lastScrollY.current = scrollY
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [isDrawerOpen])

  const handleDrawerOpenChange = (open: boolean) => {
    setIsDrawerOpen(open)
    if (!open) setMobileOpenIdx(null)
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-70 bg-blue-100 backdrop-blur border-b border-black/10',
        'transition-transform duration-300 ease-in-out',
        isVisible ? 'translate-y-0' : '-translate-y-full'
      )}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:inset-x-0 focus:top-2 mx-auto w-max rounded-lg bg-indigo-500 px-3 py-2 text-white"
      >
        Skip to content
      </a>

      <nav aria-label="Primary" className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Brand */}
          <Link
            href="/"
            prefetch={false}
            className="flex items-center gap-3 group no-underline hover:no-underline focus:no-underline"
          >
            <Image
              src={SITE_CONFIG.assets.logo}
              alt="Hope TTC"
              width={48}
              height={48}
              priority
              className="rounded-full object-contain ring-1 ring-gray-200 group-hover:ring-indigo-200 transition"
            />
            <span className="hidden md:block text-2xl font-semibold leading-tight text-gray-900 tracking-tight">
              Robonauts
            </span>
          </Link>

          {/* Desktop menu */}
          <div className="hidden lg:block">
            <ul className="flex items-center gap-2 text-[15px]">
              {menuItems.map((item, idx) => {
                const active = isActive(item.href, pathname)
                const sectionActive = item.subLinks?.some((s) =>
                  isActive(s.href, pathname)
                )

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
                                : 'text-gray-700 hover:text-indigo-700 hover:bg-blue-200'
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
                                        : 'hover:bg-sky-100 hover:text-indigo-700'
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
                          : 'text-gray-700 hover:text-indigo-700 hover:bg-sky-200'
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

          {/* Mobile burger - opens shadcn Sheet */}
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
                          onOpenChange={(open) =>
                            setMobileOpenIdx(open ? idx : null)
                          }
                        >
                          <CollapsibleTrigger asChild>
                            <button
                              type="button"
                              className={cn(
                                'flex w-full items-center justify-between p-2 text-sm font-medium rounded-lg hover:bg-indigo-50 text-gray-900',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200'
                              )}
                            >
                              <span>{item.title}</span>
                              <ChevronDown
                                className={cn(
                                  'size-4 transition-transform',
                                  mobileOpenIdx === idx && 'rotate-180'
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
                                  onClick={() => setIsDrawerOpen(false)}
                                  className={cn(
                                    'block p-2 text-sm rounded-md no-underline hover:no-underline focus:no-underline',
                                    activeSub
                                      ? 'text-indigo-700 bg-indigo-50'
                                      : 'text-gray-800 hover:bg-indigo-50 hover:text-indigo-700'
                                  )}
                                  aria-current={
                                    activeSub ? 'page' : undefined
                                  }
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
                          onClick={() => setIsDrawerOpen(false)}
                          className={cn(
                            'block p-2 text-sm font-medium rounded-lg no-underline hover:no-underline focus:no-underline',
                            isActive(item.href, pathname)
                              ? 'text-indigo-700 bg-indigo-50'
                              : 'hover:bg-indigo-50 text-gray-900'
                          )}
                          aria-current={
                            isActive(item.href, pathname) ? 'page' : undefined
                          }
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
        </div>
      </nav>
    </header>
  )
}
