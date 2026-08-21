import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type HomeSectionTone = 'wash' | 'white' | 'soft' | 'ink'

const TONE_CLASS: Record<HomeSectionTone, string> = {
  wash: 'bg-linear-to-br from-slate-50 via-indigo-50/40 to-blue-50/30',
  white: 'bg-white',
  soft: 'bg-slate-50/80',
  ink: 'bg-slate-950 text-white',
}

const MAX_WIDTH_CLASS = {
  '7xl': 'max-w-7xl',
  '4xl': 'max-w-4xl',
} as const

export function SubsectionIntro({
  title,
  description,
  as = 'h2',
  align = 'left',
}: {
  title: string
  description: string
  as?: 'h2' | 'h3'
  align?: 'left' | 'center'
}) {
  const Heading = as
  return (
    <div
      className={`mb-6 sm:mb-8 max-w-2xl ${align === 'center' ? 'mx-auto text-center' : ''}`}
    >
      <Heading className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
        {title}
      </Heading>
      <p className="mt-2 sm:mt-3 text-sm sm:text-base text-gray-600 leading-relaxed">
        {description}
      </p>
    </div>
  )
}

export function HomeSection({
  tone = 'wash',
  children,
  className = '',
  containerClassName = '',
  maxWidth = '7xl',
  showOrbs = false,
  overlap = false,
  bottomWave = false,
}: {
  tone?: HomeSectionTone
  children: ReactNode
  className?: string
  containerClassName?: string
  maxWidth?: keyof typeof MAX_WIDTH_CLASS
  showOrbs?: boolean
  overlap?: boolean
  bottomWave?: boolean
}) {
  const ink = tone === 'ink'

  return (
    <section
      className={cn(
        'relative overflow-hidden py-16 sm:py-20 md:py-24 lg:py-28',
        TONE_CLASS[tone],
        overlap && '-mt-4',
        bottomWave && 'pb-20 sm:pb-24 md:pb-28',
        className,
      )}
    >
      {showOrbs ? (
        <>
          <div
            className={cn(
              'pointer-events-none absolute -top-24 right-0 h-64 w-64 rounded-full blur-3xl',
              ink ? 'bg-indigo-500/20' : 'bg-indigo-200/25',
            )}
            aria-hidden
          />
          <div
            className={cn(
              'pointer-events-none absolute bottom-0 left-0 h-56 w-56 rounded-full blur-3xl',
              ink ? 'bg-sky-500/15' : 'bg-blue-200/20',
            )}
            aria-hidden
          />
        </>
      ) : null}

      {ink ? (
        <div
          className="bg-tech-grid pointer-events-none absolute inset-0 opacity-40 mask-[radial-gradient(ellipse_at_center,black,transparent_70%)]"
          aria-hidden
        />
      ) : null}

      <div
        className={cn(
          `${MAX_WIDTH_CLASS[maxWidth]} relative z-10 mx-auto px-4 sm:px-6 lg:px-8`,
          containerClassName,
        )}
      >
        {children}
      </div>

      {bottomWave ? (
        <svg
          className="pointer-events-none absolute inset-x-0 -bottom-px z-10 h-10 w-full text-white sm:h-14"
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            fill="currentColor"
            d="M0,48 C240,80 480,8 720,32 C960,56 1200,80 1440,40 L1440,80 L0,80 Z"
          />
        </svg>
      ) : null}
    </section>
  )
}
