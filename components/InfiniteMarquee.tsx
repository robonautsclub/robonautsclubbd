'use client'

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export default function InfiniteMarquee({
  children,
  reverse = false,
  duration = 36,
  className,
  fadeClassName = 'from-slate-50',
}: {
  children: ReactNode
  reverse?: boolean
  duration?: number
  className?: string
  fadeClassName?: string
}) {
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduceMotion(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  if (reduceMotion) {
    return (
      <div className={cn('flex flex-wrap items-center justify-center gap-3', className)}>
        {children}
      </div>
    )
  }

  return (
    <div className={cn('group/marquee relative overflow-hidden', className)}>
      <div
        className={cn(
          'pointer-events-none absolute inset-y-0 left-0 z-10 w-10 sm:w-16 bg-linear-to-r to-transparent',
          fadeClassName,
        )}
        aria-hidden
      />
      <div
        className={cn(
          'pointer-events-none absolute inset-y-0 right-0 z-10 w-10 sm:w-16 bg-linear-to-l to-transparent',
          fadeClassName,
        )}
        aria-hidden
      />
      <div
        className={reverse ? 'animate-scroll-right' : 'animate-scroll-left'}
        style={{ '--marquee-duration': `${duration}s` } as CSSProperties}
      >
        <div className="flex items-center gap-3 pr-3">{children}</div>
        <div className="flex items-center gap-3 pr-3" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  )
}
