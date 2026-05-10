'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Autoplay from 'embla-carousel-autoplay'

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

type SlideContext = {
  event: Event
  imageOk: boolean
  imageSrc: string
  useRemoteImage: boolean
  onImageError: () => void
}

function useSlideHelpers() {
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})

  const getSlide = useCallback(
    (event: Event): SlideContext => {
      const imageOk = Boolean(event.image) && !imageErrors[event.id]
      const imageSrc = imageOk ? (event.image as string) : FALLBACK_IMAGE
      const useRemoteImage =
        typeof imageSrc === 'string' &&
        (imageSrc.startsWith('http://') || imageSrc.startsWith('https://'))
      const onImageError = () =>
        setImageErrors((prev) => ({ ...prev, [event.id]: true }))
      return { event, imageOk, imageSrc, useRemoteImage, onImageError }
    },
    [imageErrors]
  )

  return { getSlide }
}

export default function FeaturedUpcomingCarousel({
  events,
  autoAdvanceMs = 7000,
  showIntroText = true,
  wrapperClassName = '',
  variant = 'default',
}: Props) {
  const [api, setApi] = useState<CarouselApi | undefined>(undefined)
  const [activeIndex, setActiveIndex] = useState(0)

  const safeEvents = useMemo(() => events.filter(Boolean), [events])
  const count = safeEvents.length
  const { getSlide } = useSlideHelpers()

  const autoplayPlugin = useRef(
    Autoplay({ delay: autoAdvanceMs, stopOnInteraction: false, stopOnMouseEnter: true })
  )

  useEffect(() => {
    if (!api) return
    const sync = () => setActiveIndex(api.selectedScrollSnap())
    sync()
    api.on('select', sync)
    api.on('reInit', sync)
    return () => {
      api.off('select', sync)
      api.off('reInit', sync)
    }
  }, [api])

  if (count === 0) return null

  const featured = safeEvents[Math.min(activeIndex, count - 1)]
  const accent = getAccentIndex(featured, activeIndex)
  const dotActiveClass = `bg-linear-to-r ${ACCENT_DOTS[accent]}`

  const rootMb = variant === 'compact' ? '' : 'mb-10 sm:mb-12'

  if (variant === 'compact') {
    return (
      <div className={`${rootMb} ${wrapperClassName}`.trim()}>
        {showIntroText ? (
          <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-200/90 mb-2 text-center lg:text-left">
            Next up
          </p>
        ) : null}
        <Carousel
          setApi={setApi}
          opts={{ loop: true }}
          plugins={count > 1 ? [autoplayPlugin.current] : []}
          className="relative rounded-lg overflow-hidden border border-white/20 bg-black/45 backdrop-blur-md shadow-lg"
        >
          {count > 1 && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => api?.scrollPrev()}
                className="absolute left-1 top-1/2 -translate-y-1/2 z-20 size-6 rounded-full bg-black/55 text-white hover:bg-black/75 hover:text-white border border-white/10"
                aria-label="Previous featured event"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => api?.scrollNext()}
                className="absolute right-1 top-1/2 -translate-y-1/2 z-20 size-6 rounded-full bg-black/55 text-white hover:bg-black/75 hover:text-white border border-white/10"
                aria-label="Next featured event"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </>
          )}

          <CarouselContent className="ml-0">
            {safeEvents.map((event, index) => {
              const slide = getSlide(event)
              const eventDates = parseEventDates(event.date)
              const slideAccent = getAccentIndex(event, index)
              const slideGradient = `bg-linear-to-r ${ACCENT_GRADIENTS[slideAccent]}`
              const category = categoryLabel(event)
              const registrationOpen = isRegistrationOpen(event)
              return (
                <CarouselItem key={event.id} className="pl-0">
                  <div className="flex flex-row items-stretch pl-7 pr-7 min-h-0">
                    <div className="relative h-17 w-20 sm:h-17 sm:w-28 shrink-0 self-center rounded-md overflow-hidden border border-white/10">
                      {slide.useRemoteImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={slide.imageSrc}
                          alt={event.title}
                          className="absolute inset-0 size-full object-cover"
                          onError={slide.onImageError}
                        />
                      ) : (
                        <Image
                          src={slide.imageSrc}
                          alt={event.title}
                          fill
                          className="object-cover"
                          sizes="(max-width:640px) 72px, 112px"
                          priority={index === 0}
                          onError={slide.onImageError}
                        />
                      )}
                      <div className="absolute inset-0 bg-black/10" />
                    </div>

                    <div className="flex-1 min-w-0 py-1.5 sm:py-2 pl-2.5 sm:pl-3 pr-1 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <Badge
                            className={`shrink-0 px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold text-white shadow-sm border-0 ${slideGradient} hover:opacity-90`}
                          >
                            {category}
                          </Badge>
                          <h3 className="text-xs sm:text-sm font-bold text-white truncate sm:whitespace-normal sm:line-clamp-1 leading-tight">
                            {event.title}
                          </h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0 mt-0.5 text-[10px] sm:text-[11px] text-gray-300">
                          <span className="inline-flex items-center gap-0.5 shrink-0">
                            <Calendar className="w-2.5 h-2.5 text-indigo-300" />
                            <span className="truncate max-w-36 sm:max-w-none">
                              {formatEventDates(eventDates)}
                            </span>
                          </span>
                          {event.time ? (
                            <>
                              <span className="text-white/35" aria-hidden>
                                ·
                              </span>
                              <span className="inline-flex items-center gap-0.5 shrink-0">
                                <Clock className="w-2.5 h-2.5 text-indigo-300" />
                                <span className="truncate">{event.time}</span>
                              </span>
                            </>
                          ) : null}
                          {event.location ? (
                            <>
                              <span className="text-white/35" aria-hidden>
                                ·
                              </span>
                              <span className="inline-flex items-center gap-0.5 min-w-0">
                                <MapPin className="w-2.5 h-2.5 shrink-0 text-indigo-300" />
                                <span className="truncate">{event.location}</span>
                              </span>
                            </>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2 sm:gap-2.5 sm:pl-1">
                        <Button
                          asChild
                          className={`h-auto px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-semibold text-white shadow-sm hover:opacity-90 hover:text-white whitespace-nowrap border-0 ${slideGradient}`}
                        >
                          <Link href={`/events/${event.id}`} prefetch={false}>
                            {registrationOpen ? 'Register' : 'Details'}
                            <ArrowRight className="w-3 h-3 shrink-0" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              )
            })}
          </CarouselContent>

          {count > 1 ? (
            <div className="absolute right-3 bottom-1 flex gap-1 justify-end z-10">
              {safeEvents.map((ev, index) => (
                <Button
                  key={ev.id}
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => api?.scrollTo(index)}
                  className={`h-1.5 rounded-full p-0 transition-all hover:bg-white/50 ${
                    index === activeIndex
                      ? `w-5 ${dotActiveClass} hover:opacity-90`
                      : 'w-1.5 bg-white/35'
                  }`}
                  aria-label={`Show ${ev.title}`}
                  aria-current={index === activeIndex}
                />
              ))}
            </div>
          ) : null}
        </Carousel>
      </div>
    )
  }

  return (
    <div className={`${rootMb} ${wrapperClassName}`.trim()}>
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

      <Carousel
        setApi={setApi}
        opts={{ loop: true }}
        plugins={count > 1 ? [autoplayPlugin.current] : []}
        className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-gray-200 shadow-xl bg-gray-900"
      >
        {count > 1 && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => api?.scrollPrev()}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 size-10 sm:size-12 rounded-full bg-black/40 text-white hover:bg-black/60 hover:text-white backdrop-blur-sm"
              aria-label="Previous featured event"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => api?.scrollNext()}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 size-10 sm:size-12 rounded-full bg-black/40 text-white hover:bg-black/60 hover:text-white backdrop-blur-sm"
              aria-label="Next featured event"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </Button>
          </>
        )}

        <CarouselContent className="ml-0">
          {safeEvents.map((event, index) => {
            const slide = getSlide(event)
            const eventDates = parseEventDates(event.date)
            const slideAccent = getAccentIndex(event, index)
            const slideGradient = `bg-linear-to-r ${ACCENT_GRADIENTS[slideAccent]}`
            const slideDot = ACCENT_DOTS[slideAccent]
            const category = categoryLabel(event)
            const highlights = highlightsFor(event)
            const registrationOpen = isRegistrationOpen(event)
            return (
              <CarouselItem key={event.id} className="pl-0">
                <div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-0">
                  <div className="relative min-h-[220px] aspect-4/3 lg:aspect-auto lg:min-h-[320px] w-full">
                    {slide.useRemoteImage ? (
                      // eslint-disable-next-line @next/next/no-img-element -- avoids hostname allowlist gaps for arbitrary event image URLs
                      <img
                        src={slide.imageSrc}
                        alt={event.title}
                        className="absolute inset-0 size-full object-cover transition-opacity duration-300"
                        onError={slide.onImageError}
                      />
                    ) : (
                      <Image
                        src={slide.imageSrc}
                        alt={event.title}
                        fill
                        className="object-cover transition-opacity duration-300"
                        sizes="(max-width: 1024px) 100vw, 55vw"
                        priority={index === 0}
                        onError={slide.onImageError}
                      />
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent lg:bg-linear-to-r lg:from-transparent lg:via-black/25 lg:to-black/70" />
                    <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 lg:p-8">
                      <Badge
                        className={`px-3 py-1 rounded-full text-xs font-bold text-white shadow-md border-0 ${slideGradient} hover:opacity-90`}
                      >
                        {category}
                      </Badge>
                      <h3 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white drop-shadow-sm line-clamp-2">
                        {event.title}
                      </h3>
                    </div>
                  </div>

                  <div className="bg-gray-950 text-white p-5 sm:p-7 lg:p-8 flex flex-col border-t lg:border-t-0 lg:border-l border-white/10">
                    <p className="text-gray-300 text-sm sm:text-base leading-relaxed line-clamp-4 sm:line-clamp-5 mb-6">
                      {event.description}
                    </p>

                    <div className="space-y-3 text-sm sm:text-base mb-6">
                      <div className="flex gap-3 text-gray-200">
                        <Calendar className="w-5 h-5 shrink-0 text-indigo-400" />
                        <span className="font-medium">{formatEventDates(eventDates)}</span>
                      </div>
                      {event.time ? (
                        <div className="flex gap-3 text-gray-200">
                          <Clock className="w-5 h-5 shrink-0 text-indigo-400" />
                          <span>{event.time}</span>
                        </div>
                      ) : null}
                      {event.location ? (
                        <div className="flex gap-3 text-gray-200">
                          <MapPin className="w-5 h-5 shrink-0 text-indigo-400" />
                          <span className="line-clamp-2">{event.location}</span>
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
                              key={`${event.id}-hl-${idx}`}
                              className="flex gap-2 text-sm text-gray-200"
                            >
                              <span
                                className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-linear-to-r ${slideDot}`}
                                aria-hidden
                              />
                              <span>{h}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="mt-auto">
                      <Button
                        asChild
                        size="lg"
                        className={`h-auto px-5 py-3 rounded-xl font-semibold text-white shadow-lg hover:opacity-90 hover:text-white border-0 ${slideGradient}`}
                      >
                        <Link href={`/events/${event.id}`} prefetch={false}>
                          {registrationOpen ? 'Register' : 'View details'}
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            )
          })}
        </CarouselContent>

        {count > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex flex-wrap gap-2 px-4 py-2 rounded-full bg-black/40 backdrop-blur-sm border border-white/10">
            {safeEvents.map((ev, index) => (
              <Button
                key={ev.id}
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => api?.scrollTo(index)}
                className={`h-2.5 rounded-full p-0 transition-all hover:bg-gray-500 ${
                  index === activeIndex
                    ? `w-10 ${dotActiveClass} hover:opacity-90`
                    : 'w-2.5 bg-gray-600'
                }`}
                aria-label={`Show ${ev.title}`}
                aria-current={index === activeIndex}
              />
            ))}
          </div>
        )}
      </Carousel>
    </div>
  )
}
