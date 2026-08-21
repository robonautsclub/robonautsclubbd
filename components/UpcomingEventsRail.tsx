'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { Event } from '@/types/event'
import { parseEventDates } from '@/lib/dateUtils'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import Autoplay from 'embla-carousel-autoplay'
import { useRef } from 'react'

function eventDateParts(date: Event['date']) {
  const dates = parseEventDates(date)
  const raw = dates[0] ?? ''
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) {
    const month = new Date(Number(match[1]), Number(match[2]) - 1, 1).toLocaleString(
      'en-US',
      { month: 'short' },
    )
    return { month, day: String(Number(match[3])) }
  }
  return { month: 'Soon', day: '—' }
}

function categoryLabel(event: Event) {
  if (event.tags && event.tags.length > 0) return event.tags[0]
  return 'Event'
}

export default function UpcomingEventsRail({ events }: { events: Event[] }) {
  const autoplay = useRef(
    Autoplay({ delay: 5200, stopOnInteraction: false, stopOnMouseEnter: true }),
  )

  if (events.length === 0) return null

  return (
    <div className="w-full">
      <div className="mb-3 flex items-end justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-200/90">
          Upcoming opportunities
        </p>
        <Link
          href="/events"
          prefetch={false}
          className="group inline-flex items-center gap-1 text-xs font-medium text-white/70 transition-colors hover:text-white"
        >
          All events
          <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
        </Link>
      </div>

      <Carousel
        opts={{ align: 'start', loop: events.length > 2 }}
        plugins={events.length > 2 ? [autoplay.current] : []}
        className="relative"
      >
        {events.length > 1 ? (
          <>
            <CarouselPrevious className="left-0 hidden size-8 border-white/20 bg-black/40 text-white hover:bg-black/60 hover:text-white disabled:hidden sm:flex sm:-left-3" />
            <CarouselNext className="right-0 hidden size-8 border-white/20 bg-black/40 text-white hover:bg-black/60 hover:text-white disabled:hidden sm:flex sm:-right-3" />
          </>
        ) : null}

        <CarouselContent className="-ml-3">
          {events.map((event) => {
            const parts = eventDateParts(event.date)
            const category = categoryLabel(event)
            return (
              <CarouselItem
                key={event.id}
                className="pl-3 basis-[min(17.5rem,82vw)] sm:basis-76"
              >
                <Link
                  href={`/events/${event.id}`}
                  prefetch={false}
                  className="group flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-3 py-2.5 shadow-[0_12px_40px_-20px_rgba(0,0,0,0.8)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-200/40 hover:bg-white/15"
                >
                  <div className="flex h-14 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-200">
                      {parts.month}
                    </span>
                    <span className="text-lg font-bold leading-none text-white">
                      {parts.day}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{event.title}</p>
                    <span className="mt-1 inline-flex rounded-full bg-indigo-400/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-100 ring-1 ring-indigo-300/20">
                      {category}
                    </span>
                  </div>
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/80 transition-all duration-300 group-hover:bg-indigo-500 group-hover:text-white">
                    <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                    <span className="sr-only">View {event.title}</span>
                  </span>
                </Link>
              </CarouselItem>
            )
          })}
        </CarouselContent>
      </Carousel>
    </div>
  )
}
