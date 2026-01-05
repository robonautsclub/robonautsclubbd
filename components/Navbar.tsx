'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'
import { Inter, Poppins } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-poppins'
})

type MenuItem = { title: string; href: string }

function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(' ')
}

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

  const navRef = useRef<HTMLElement | null>(null)
  const drawerRef = useRef<HTMLElement | null>(null)

  const menuItems: MenuItem[] = [
    { title: 'Home', href: '/' },
    { title: 'Event', href: '/event' },
    { title: 'About', href: '/about' },
  ]

  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      const t = e.target as Node
      const insideNav = navRef.current?.contains(t)
      const insideDrawer = drawerRef.current?.contains(t)
      if (!insideNav) setIsDrawerOpen(false)
      if (isDrawerOpen && !insideDrawer) setIsDrawerOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsDrawerOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [isDrawerOpen])

  // Lock body scroll when drawer open
  useEffect(() => {
    if (!isDrawerOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isDrawerOpen])

  // Prevent horizontal overflow
  useEffect(() => {
    document.documentElement.classList.add('overflow-x-clip')
    return () => {
      document.documentElement.classList.remove('overflow-x-clip')
    }
  }, [])

  return (
    <header
      className={classNames(
        inter.variable,
        poppins.variable,
        'sticky top-0 z-70 bg-purple-50 backdrop-blur  border-black/10 border-b'
      )}
      style={{ borderColor: 'rgba(17,24,39,0.12)' }}
    >
      <a
        href='#main'
        className='sr-only focus:not-sr-only focus:absolute focus:inset-x-0 focus:top-2 mx-auto w-max rounded-lg bg-indigo-600 px-3 py-2 text-white'
      >
        Skip to content
      </a>
      <nav ref={navRef} aria-label='Primary' className='mx-auto max-w-7xl'>
        <div className='flex items-center justify-between px-4 py-3'>
          {/* Brand */}
          <Link
            href='/'
            className='flex items-center gap-3 group no-underline hover:no-underline focus:no-underline'
          >
            <Image
              src='/robologo.jpg'
              alt='Hope TTC'
              width={48}
              height={48}
              priority
              className='rounded-full object-contain ring-1 ring-gray-200 group-hover:ring-indigo-200 transition'
            />
            <span className='hidden md:block text-lg font-semibold leading-tight text-gray-900 tracking-tight'>
            ROBONAUTS CLUB
            </span>
          </Link>
          {/* Desktop menu */}
          <div className='hidden lg:block'>
            <ul className='flex items-center gap-2 text-[15px]'>
              {menuItems.map((item, idx) => {
                const active = isActive(item.href, pathname)
                return (
                  <li key={idx}>
                    <Link
                      href={item.href}
                      className={classNames(
                        'py-2 px-3 font-medium rounded-lg transition-colors no-underline hover:no-underline focus:no-underline',
                        active
                          ? 'text-indigo-800 bg-indigo-50'
                          : 'text-gray-700 hover:text-indigo-800 hover:bg-indigo-50'
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
          {/* Mobile burger */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className='lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg text-gray-700 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300'
            aria-controls='mobile-drawer'
            aria-expanded={isDrawerOpen}
            aria-label='Open main menu'
            type='button'
          >
            <svg
              className='w-5 h-5'
              viewBox='0 0 17 14'
              fill='none'
              aria-hidden='true'
            >
              <path
                d='M1 1h15M1 7h15M1 13h15'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
          </button>
        </div>
      </nav>
      {/* Backdrop + Drawer: render ONLY when open */}
      {isDrawerOpen && (
        <>
          <button
            aria-label='Close menu'
            onClick={() => setIsDrawerOpen(false)}
            className='fixed inset-0 z-80 bg-black/40 backdrop-blur-sm transition-opacity lg:hidden'
            type='button'
          />
          <aside
            id='mobile-drawer'
            ref={drawerRef}
            className={classNames(
              'fixed inset-y-0 right-0 z-90 w-4/5 max-w-sm transform bg-purple-50 shadow-2xl transition-transform duration-200 lg:hidden',
              'h-dvh max-h-dvh overflow-hidden',
              'pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]',
              isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
            )}
            role='dialog'
            aria-modal='true'
            aria-label='Mobile Navigation'
            style={{ height: '100dvh' }}
          >
            <div className='flex h-full flex-col'>
              <div className='px-4 pb-3 sticky top-0 bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/80 border-b border-black/10 z-10'>
                <div className='flex items-center justify-between py-2'>
                  <span className='font-semibold text-gray-900'>Menu</span>
                  <button
                    type='button'
                    aria-label='Close'
                    onClick={() => setIsDrawerOpen(false)}
                    className='inline-flex items-center justify-center w-9 h-9 rounded-lg text-gray-600 hover:bg-indigo-50'
                  >
                    <svg
                      className='w-4.5 h-4.5'
                      viewBox='0 0 24 24'
                      fill='none'
                      aria-hidden='true'
                    >
                      <path
                        d='M6 6l12 12M18 6L6 18'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                      />
                    </svg>
                  </button>
                </div>
              </div>
              <div className='flex-1 overflow-y-auto overscroll-contain px-4 py-4'>
                <nav className='grid gap-2' aria-label='Mobile navigation'>
                  {menuItems.map((item, idx) => (
                    <Link
                      key={idx}
                      href={item.href}
                      onClick={() => setIsDrawerOpen(false)}
                      className={classNames(
                        'block p-2 text-sm font-medium rounded-lg no-underline hover:no-underline focus:no-underline',
                        isActive(item.href, pathname)
                          ? 'text-indigo-800 bg-indigo-50'
                          : 'hover:bg-indigo-50 text-gray-900'
                      )}
                      aria-current={
                        isActive(item.href, pathname) ? 'page' : undefined
                      }
                    >
                      {item.title}
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
          </aside>
        </>
      )}
    </header>
  )
}