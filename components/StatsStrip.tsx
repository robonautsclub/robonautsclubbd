'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

type Stat = {
  end: number
  suffix: string
  label: string
}

const DEFAULT_STATS: Stat[] = [
  { end: 50, suffix: '+', label: 'Participants' },
  { end: 15, suffix: '+', label: 'Awards' },
  { end: 100, suffix: '%', label: 'Satisfaction' },
]

function useInView<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.35 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return { ref, inView }
}

function AnimatedValue({
  end,
  suffix,
  active,
}: {
  end: number
  suffix: string
  active: boolean
}) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!active) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setValue(end)
      return
    }

    const duration = 1400
    const start = performance.now()
    let frame = 0

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(end * eased))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [active, end])

  return (
    <>
      {value}
      {suffix}
    </>
  )
}

export default function StatsStrip({
  stats = DEFAULT_STATS,
  tone = 'dark',
}: {
  stats?: Stat[]
  tone?: 'dark' | 'light'
}) {
  const { ref, inView } = useInView<HTMLDivElement>()
  const dark = tone === 'dark'

  return (
    <div
      ref={ref}
      className="grid grid-cols-2 gap-8 sm:grid-cols-3 sm:gap-10"
    >
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className={cn('text-left', index === 2 && 'col-span-2 sm:col-span-1')}
        >
          <p
            className={cn(
              'text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl',
              dark
                ? 'bg-linear-to-r from-sky-200 to-indigo-200 bg-clip-text text-transparent'
                : 'text-indigo-700',
            )}
          >
            <AnimatedValue end={stat.end} suffix={stat.suffix} active={inView} />
          </p>
          <p
            className={cn(
              'mt-2 text-sm font-medium tracking-wide sm:text-base',
              dark ? 'text-slate-300' : 'text-gray-600',
            )}
          >
            {stat.label}
          </p>
        </div>
      ))}
    </div>
  )
}
