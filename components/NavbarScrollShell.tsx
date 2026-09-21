'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Sticky header that hides on scroll-down; wraps server-rendered nav chrome. */
export default function NavbarScrollShell({ children }: { children: ReactNode }) {
  const [isVisible, setIsVisible] = useState(true)
  const lastScrollY = useRef(0)
  const drawerOpenRef = useRef(false)

  useEffect(() => {
    document.documentElement.classList.add('overflow-x-clip')
    return () => {
      document.documentElement.classList.remove('overflow-x-clip')
    }
  }, [])

  useEffect(() => {
    const onScroll = () => {
      if (drawerOpenRef.current) return
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
  }, [])

  useEffect(() => {
    const onDrawer = (e: Event) => {
      const detail = (e as CustomEvent<{ open: boolean }>).detail
      drawerOpenRef.current = Boolean(detail?.open)
      if (detail?.open) setIsVisible(true)
    }
    window.addEventListener('nav-drawer', onDrawer as EventListener)
    return () => window.removeEventListener('nav-drawer', onDrawer as EventListener)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-70 bg-blue-100 backdrop-blur border-b border-black/10',
        'transition-transform duration-300 ease-in-out',
        isVisible ? 'translate-y-0' : '-translate-y-full',
      )}
    >
      {children}
    </header>
  )
}
