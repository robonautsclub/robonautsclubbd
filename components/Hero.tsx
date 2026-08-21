'use client'

import { useState, useEffect } from 'react'
import { SITE_CONFIG } from '@/lib/site-config'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Volume2, VolumeX } from 'lucide-react'
import UpcomingEventsRail from '@/components/UpcomingEventsRail'
import type { Event } from '@/types/event'
import { Button } from '@/components/ui/button'

const HERO_VIDEO =
  'https://res.cloudinary.com/digkc0xsk/video/upload/v1771270419/ROBOFESTnew_lj6ak1.mp4'
/** First-frame still from Cloudinary — lighter initial paint than decoding video immediately. */
const HERO_VIDEO_POSTER =
  'https://res.cloudinary.com/digkc0xsk/video/upload/f_jpg,q_80,so_0/v1771270419/ROBOFESTnew_lj6ak1.jpg'

const TRACK_TAGS = ['STEM', 'Robotics', 'Olympiad', 'Innovation'] as const

export default function Hero({ upcomingEvents = [] }: { upcomingEvents?: Event[] }) {
  const [muted, setMuted] = useState(true)
  /** Avoid Cloudinary video bytes on small viewports / reduced motion — fewer network requests. */
  const [useVideoBg, setUseVideoBg] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setUseVideoBg(mq.matches && !motion.matches)
    sync()
    mq.addEventListener('change', sync)
    motion.addEventListener('change', sync)
    return () => {
      mq.removeEventListener('change', sync)
      motion.removeEventListener('change', sync)
    }
  }, [])

  const hasEvents = upcomingEvents.length > 0

  return (
    <section className="relative flex min-h-svh w-full min-w-full flex-col overflow-hidden">
      {useVideoBg ? (
        <video
          className="absolute inset-0 z-0 h-full w-full object-cover object-[70%_center] sm:object-center"
          src={HERO_VIDEO}
          poster={HERO_VIDEO_POSTER}
          preload="metadata"
          autoPlay
          muted={muted}
          loop
          playsInline
          aria-hidden="true"
        />
      ) : (
        <div className="absolute inset-0 z-0" aria-hidden="true">
          <Image
            src={HERO_VIDEO_POSTER}
            alt=""
            fill
            priority
            className="object-cover object-[70%_center] sm:object-center"
            sizes="100vw"
            quality={80}
          />
        </div>
      )}

      {/* Left-weighted scrim — right side stays open for video */}
      <div
        className="absolute inset-0 z-1 bg-linear-to-r from-slate-950/90 via-slate-950/55 to-transparent lg:via-slate-950/40"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 z-1 bg-linear-to-t from-slate-950/60 via-transparent to-slate-950/25"
        aria-hidden="true"
      />
      <div
        className="bg-tech-grid pointer-events-none absolute inset-0 z-1 opacity-35 mask-[radial-gradient(ellipse_50%_65%_at_12%_40%,black,transparent)]"
        aria-hidden="true"
      />

      {/* Full-bleed left content — not centered in max-w box */}
      <div className="relative z-10 flex w-full flex-1 flex-col pt-28 sm:pt-32 lg:pt-28">
        <div className="flex flex-1 items-center px-4 py-8 sm:px-6 sm:py-10 lg:px-10 xl:px-14">
          <div className="w-full max-w-[28rem] space-y-6 text-left sm:max-w-md md:max-w-lg lg:max-w-xl lg:space-y-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-200/90 sm:text-xs">
              {SITE_CONFIG.name} · STEM · Robotics · Olympiads
            </p>

            <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)] sm:text-5xl md:text-6xl lg:text-[4.25rem] lg:leading-[0.95]">
              <span className="block">Build Skills.</span>
              <span className="block">Break Barriers.</span>
              <span className="mt-1 block bg-linear-to-r from-sky-200 via-indigo-200 to-sky-100 bg-clip-text text-transparent">
                Go Global.
              </span>
            </h1>

            <p className="max-w-md text-base leading-relaxed text-slate-100/90 sm:text-lg">
              Hands-on robotics, competition pathways, and international stages for students
              ready to build what comes next.
            </p>

            <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-xl bg-indigo-500 px-7 text-base font-semibold text-white shadow-[0_16px_40px_-16px_rgba(99,102,241,0.9)] hover:bg-indigo-600"
              >
                <Link href="/events" prefetch={false}>
                  Explore Events
                  <ArrowRight className="size-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-xl border-white/30 bg-transparent px-7 text-base font-medium text-white/90 hover:border-white/50 hover:bg-white/10 hover:text-white"
              >
                <Link href="/about" prefetch={false}>
                  Learn More
                </Link>
              </Button>
            </div>

            <ul className="flex flex-wrap gap-2 pt-1">
              {TRACK_TAGS.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/80"
                >
                  {tag}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Upcoming events stay in the hero — always above the wave */}
        {hasEvents ? (
          <div className="relative z-20 mt-auto w-full px-4 pb-20 sm:px-6 sm:pb-24 lg:px-10 lg:pb-20 xl:px-14">
            <UpcomingEventsRail events={upcomingEvents} />
          </div>
        ) : (
          <div className="pb-20 sm:pb-24 lg:pb-20" />
        )}
      </div>

      {useVideoBg ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setMuted((m) => !m)}
          className="absolute right-5 bottom-8 z-30 rounded-full border border-white/20 bg-black/50 text-white hover:bg-black/70 hover:text-white"
          aria-label={muted ? 'Unmute video' : 'Mute video'}
        >
          {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
        </Button>
      ) : null}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-2 h-24 bg-linear-to-t from-slate-50 to-transparent" />
      <svg
        className="pointer-events-none absolute inset-x-0 bottom-0 z-3 h-10 w-full text-slate-50 sm:h-14"
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          fill="currentColor"
          d="M0,48 C240,80 480,8 720,32 C960,56 1200,80 1440,40 L1440,80 L0,80 Z"
        />
      </svg>
    </section>
  )
}
