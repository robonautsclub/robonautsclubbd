import type { ReactNode } from 'react'

export type HomeSectionTone = 'wash' | 'white' | 'soft'

const TONE_CLASS: Record<HomeSectionTone, string> = {
  wash: 'bg-linear-to-br from-slate-50 via-indigo-50/40 to-blue-50/30',
  white: 'bg-white',
  soft: 'bg-slate-50/80',
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
}: {
  tone?: HomeSectionTone
  children: ReactNode
  className?: string
  containerClassName?: string
  maxWidth?: keyof typeof MAX_WIDTH_CLASS
  showOrbs?: boolean
}) {
  return (
    <section
      className={`py-10 sm:py-16 md:py-20 lg:py-24 relative overflow-hidden ${TONE_CLASS[tone]} ${className}`}
    >
      <div
        className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-gray-200 to-transparent"
        aria-hidden
      />
      {showOrbs ? (
        <>
          <div
            className="pointer-events-none absolute -top-24 right-0 h-64 w-64 rounded-full bg-indigo-200/25 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute bottom-0 left-0 h-56 w-56 rounded-full bg-blue-200/20 blur-3xl"
            aria-hidden
          />
        </>
      ) : null}
      <div
        className={`${MAX_WIDTH_CLASS[maxWidth]} mx-auto px-4 sm:px-6 lg:px-8 relative z-10 ${containerClassName}`}
      >
        {children}
      </div>
    </section>
  )
}
