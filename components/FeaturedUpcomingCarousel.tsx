'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  ArrowRight,
} from 'lucide-react'
import { Event } from '@/types/event'
import { parseEventDates, formatEventDates, isRegistrationOpen } from '@/lib/dateUtils'
import { SITE_CONFIG } from '@/lib/site-config'

const FALLBACK_IMAGE = '/robot.gif'

/** Accent gradients for carousel chrome (cycles by slide index). */
const ACCENT_GRADIENTS = [
  'from-rose-600 to-orange-500',
  'from-emerald-600 to-teal-500',
  'from-violet-600 to-indigo-500',
  'from-sky-600 to-cyan-500',
] as const

const ACCENT_DOTS = [
  'from-rose-500 to-orange-400',
  'from-emerald-500 to-teal-400',
  'from-violet-500 to-indigo-400',
  'from-sky-500 to-cyan-400',
] as const

function categoryLabel(event: Event): string {
  if (event.tags && event.tags.length > 0) return event.tags[0]
  return 'Event'
}

function highlightsFor(event: Event): string[] {
  if (event.tags && event.tags.length > 0) {
    return event.tags.slice(0, 6)
  }
  const sentence = event.description?.trim()
  if (!sentence) return []
  const cut = sentence.length > 120 ? `${sentence.slice(0, 117)}…` : sentence
  return [cut]
}

function getAccentIndex(event: Event, slideIndex: number): number {
  let h = 0
  for (let i = 0; i < event.id.length; i++) h = (h + event.id.charCodeAt(i)) % 997
  return (h + slideIndex) % ACCENT_GRADIENTS.length
}

type Props = {
  events: Event[]
  autoAdvanceMs?: number
  showIntroText?: boolean
  wrapperClassName?: string
  /** `compact` is for the home hero over video (small glass card). */
  variant?: 'default' | 'compact'
}

export default function FeaturedUpcomingCarousel({
  events,
  autoAdvanceMs = 7000,
  showIntroText = true,
  wrapperClassName = '',
  variant = 'default',
}: Props) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})

  const safeEvents = useMemo(() => events.filter(Boolean), [events])
  const count = safeEvents.length

  const goPrev = useCallback(() => {
    if (count < 1) return
    setActiveIndex((i) => {
      const cur = Math.min(i, count - 1)
      return cur === 0 ? count - 1 : cur - 1
    })
  }, [count])

  const goNext = useCallback(() => {
    if (count < 1) return
    setActiveIndex((i) => {
      const cur = Math.min(i, count - 1)
      return (cur + 1) % count
    })
  }, [count])

  useEffect(() => {
    if (count <= 1 || paused) return
    const t = setInterval(goNext, autoAdvanceMs)
    return () => clearInterval(t)
  }, [count, paused, goNext, autoAdvanceMs])

  const displayIndex = count > 0 ? Math.min(activeIndex, count - 1) : 0
  const featured = safeEvents[displayIndex]

  if (!featured || count === 0) return null

  const eventDates = parseEventDates(featured.date)
  const accent = getAccentIndex(featured, displayIndex)
  const gradientClass = `bg-linear-to-r ${ACCENT_GRADIENTS[accent]}`
  const dotActiveClass = `bg-linear-to-r ${ACCENT_DOTS[accent]}`
  const category = categoryLabel(featured)
  const highlights = highlightsFor(featured)
  const imageOk = featured.image && !imageErrors[featured.id]
  const imageSrc = imageOk ? featured.image! : FALLBACK_IMAGE
  const registrationOpen = isRegistrationOpen(featured)
  const useRemoteImage =
    typeof imageSrc === 'string' &&
    (imageSrc.startsWith('http://') || imageSrc.startsWith('https://'))

  const rootMb = variant === 'compact' ? '' : 'mb-10 sm:mb-12'

  if (variant === 'compact') {
    return (
      <div
        className={`${rootMb} ${wrapperClassName}`.trim()}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {showIntroText ? (
          <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-200/90 mb-2 text-center lg:text-left">
            Next up
          </p>
        ) : null}
        <div className="relative rounded-lg overflow-hidden border border-white/20 bg-black/45 backdrop-blur-md shadow-lg">
          {count > 1 && (
            <>
              <button
                type="button"
                onClick={goPrev}
                className="absolute left-1 top-1/2 -translate-y-1/2 z-20 p-0.5 rounded-full bg-black/55 text-white hover:bg-black/75 border border-white/10"
                aria-label="Previous featured event"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={goNext}
                className="absolute right-1 top-1/2 -translate-y-1/2 z-20 p-0.5 rounded-full bg-black/55 text-white hover:bg-black/75 border border-white/10"
                aria-label="Next featured event"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          <div className="flex flex-row items-stretch pl-7 pr-7 min-h-0">
            <div className="relative h-17 w-20 sm:h-17 sm:w-28 shrink-0 self-center rounded-md overflow-hidden border border-white/10">
              {useRemoteImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageSrc}
                  alt={featured.title}
                  className="absolute inset-0 size-full object-cover"
                  onError={() =>
                    setImageErrors((prev) => ({ ...prev, [featured.id]: true }))
                  }
                />
              ) : (
                <Image
                  src={imageSrc}
                  alt={featured.title}
                  fill
                  className="object-cover"
                  sizes="(max-width:640px) 72px, 112px"
                  priority
                  onError={() =>
                    setImageErrors((prev) => ({ ...prev, [featured.id]: true }))
                  }
                />
              )}
              <div className="absolute inset-0 bg-black/10" />
            </div>

            <div className="flex-1 min-w-0 py-1.5 sm:py-2 pl-2.5 sm:pl-3 pr-1 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`shrink-0 px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold text-white shadow-sm ${gradientClass}`}
                  >
                    {category}
                  </span>
                  <h3 className="text-xs sm:text-sm font-bold text-white truncate sm:whitespace-normal sm:line-clamp-1 leading-tight">
                    {featured.title}
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0 mt-0.5 text-[10px] sm:text-[11px] text-gray-300">
                  <span className="inline-flex items-center gap-0.5 shrink-0">
                    <Calendar className="w-2.5 h-2.5 text-indigo-300" />
                    <span className="truncate max-w-36 sm:max-w-none">
                      {formatEventDates(eventDates)}
                    </span>
                  </span>
                  {featured.time ? (
                    <>
                      <span className="text-white/35" aria-hidden>
                        ·
                      </span>
                      <span className="inline-flex items-center gap-0.5 shrink-0">
                        <Clock className="w-2.5 h-2.5 text-indigo-300" />
                        <span className="truncate">{featured.time}</span>
                      </span>
                    </>
                  ) : null}
                  {featured.location ? (
                    <>
                      <span className="text-white/35" aria-hidden>
                        ·
                      </span>
                      <span className="inline-flex items-center gap-0.5 min-w-0">
                        <MapPin className="w-2.5 h-2.5 shrink-0 text-indigo-300" />
                        <span className="truncate">{featured.location}</span>
                      </span>
                    </>
                  ) : null}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2 sm:gap-2.5 sm:pl-1">
                <Link
                  href={`/events/${featured.id}`}
                  className={`inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-90 whitespace-nowrap ${gradientClass}`}
                >
                  {registrationOpen ? 'Register' : 'Details'}
                  <ArrowRight className="w-3 h-3 shrink-0" />
                </Link>
                {count > 1 ? (
                  <div className="flex gap-1 justify-end">
                    {safeEvents.map((ev, index) => (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={() => setActiveIndex(index)}
                        className={`h-1.5 rounded-full transition-all ${
                          index === displayIndex
                            ? `w-5 ${dotActiveClass}`
                            : 'w-1.5 bg-white/35 hover:bg-white/50'
                        }`}
                        aria-label={`Show ${ev.title}`}
                        aria-current={index === displayIndex}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`${rootMb} ${wrapperClassName}`.trim()}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {showIntroText && (
        <>
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600 mb-1">
            Ready to compete?
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Upcoming competitions &amp; events
          </h2>
          <p className="text-gray-600 text-sm sm:text-base max-w-3xl mb-6 sm:mb-8">
            Spotlight on what&apos;s next—workshops, competitions, and community events from{' '}
            {SITE_CONFIG.name}.
          </p>
        </>
      )}

      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-gray-200 shadow-xl bg-gray-900">
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-3 rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-sm transition-colors"
              aria-label="Previous featured event"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-3 rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-sm transition-colors"
              aria-label="Next featured event"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </>
        )}

        <div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-0">
          <div className="relative min-h-[220px] aspect-4/3 lg:aspect-auto lg:min-h-[320px] w-full">
            {useRemoteImage ? (
              // eslint-disable-next-line @next/next/no-img-element -- avoids hostname allowlist gaps for arbitrary event image URLs
              <img
                src={imageSrc}
                alt={featured.title}
                className="absolute inset-0 size-full object-cover transition-opacity duration-300"
                onError={() =>
                  setImageErrors((prev) => ({ ...prev, [featured.id]: true }))
                }
              />
            ) : (
              <Image
                src={imageSrc}
                alt={featured.title}
                fill
                className="object-cover transition-opacity duration-300"
                sizes="(max-width: 1024px) 100vw, 55vw"
                priority
                onError={() =>
                  setImageErrors((prev) => ({ ...prev, [featured.id]: true }))
                }
              />
            )}
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent lg:bg-linear-to-r lg:from-transparent lg:via-black/25 lg:to-black/70" />
            <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 lg:p-8">
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-bold text-white shadow-md ${gradientClass}`}
              >
                {category}
              </span>
              <h3 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white drop-shadow-sm line-clamp-2">
                {featured.title}
              </h3>
            </div>
          </div>

          <div className="bg-gray-950 text-white p-5 sm:p-7 lg:p-8 flex flex-col border-t lg:border-t-0 lg:border-l border-white/10">
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed line-clamp-4 sm:line-clamp-5 mb-6">
              {featured.description}
            </p>

            <div className="space-y-3 text-sm sm:text-base mb-6">
              <div className="flex gap-3 text-gray-200">
                <Calendar className="w-5 h-5 shrink-0 text-indigo-400" />
                <span className="font-medium">{formatEventDates(eventDates)}</span>
              </div>
              {featured.time ? (
                <div className="flex gap-3 text-gray-200">
                  <Clock className="w-5 h-5 shrink-0 text-indigo-400" />
                  <span>{featured.time}</span>
                </div>
              ) : null}
              {featured.location ? (
                <div className="flex gap-3 text-gray-200">
                  <MapPin className="w-5 h-5 shrink-0 text-indigo-400" />
                  <span className="line-clamp-2">{featured.location}</span>
                </div>
              ) : null}
            </div>

            {highlights.length > 0 && (
              <div className="mb-8">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                  Highlights
                </p>
                <ul className="space-y-2">
                  {highlights.map((h, idx) => (
                    <li
                      key={`${featured.id}-hl-${idx}`}
                      className="flex gap-2 text-sm text-gray-200"
                    >
                      <span
                        className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-linear-to-r ${ACCENT_DOTS[accent]}`}
                        aria-hidden
                      />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-auto">
              <Link
                href={`/events/${featured.id}`}
                className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-white shadow-lg transition-opacity hover:opacity-90 ${gradientClass}`}
              >
                {registrationOpen ? 'Register' : 'View details'}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {count > 1 && (
              <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-white/10">
                {safeEvents.map((ev, index) => (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={`h-2.5 rounded-full transition-all ${
                      index === displayIndex
                        ? `w-10 ${dotActiveClass}`
                        : 'w-2.5 bg-gray-600 hover:bg-gray-500'
                    }`}
                    aria-label={`Show ${ev.title}`}
                    aria-current={index === displayIndex}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
