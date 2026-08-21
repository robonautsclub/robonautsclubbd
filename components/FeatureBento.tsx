'use client'

import Image from 'next/image'
import { BookOpen, Trophy, Users, Wrench } from 'lucide-react'
import { SITE_CONFIG } from '@/lib/site-config'
import Reveal from '@/components/Reveal'
import { cn } from '@/lib/utils'

const FEATURES = [
  {
    id: 'hands-on',
    icon: Wrench,
    title: 'Hands-on STEM',
    description:
      'Build and program real robots and projects that turn theory into something you can hold, test, and improve.',
    extra: 'Circuits, code, mechanical design — practiced in the lab, not just on a slide.',
    span: 'md:col-span-2 lg:col-span-7 lg:row-span-2',
    article:
      'min-h-[280px] lg:min-h-[420px] bg-slate-950 text-white',
  },
  {
    id: 'mentors',
    icon: Users,
    title: 'Expert Mentors',
    description:
      'Learn beside instructors who have walked the competition floor and know how to coach the next step.',
    extra: 'Guidance that scales from first build to international briefings.',
    span: 'lg:col-span-5',
    article: 'bg-white',
  },
  {
    id: 'olympiad',
    icon: Trophy,
    title: 'Olympiad & Competition Focus',
    description:
      'Specialized pathways for national and international robotics, STEM, and academic contests.',
    extra: 'Strategy, teamwork, and stage-ready confidence.',
    span: 'lg:col-span-5',
    article: 'bg-linear-to-br from-indigo-50 via-white to-sky-50',
  },
  {
    id: 'ecosystem',
    icon: BookOpen,
    title: 'One Stop ECA Solution',
    description:
      'Workshops, competitions, mentorship, and community — one ecosystem for young innovators.',
    extra: 'From first curiosity to a portfolio that travels.',
    span: 'md:col-span-2 lg:col-span-12',
    article: 'bg-white',
  },
] as const

const ECOSYSTEM_TAGS = ['Workshops', 'Competitions', 'Mentorship', 'Community'] as const

export default function FeatureBento() {
  return (
    <div>
      <Reveal className="mb-8 max-w-3xl sm:mb-10 md:mb-12">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-indigo-600 sm:text-xs">
          Why {SITE_CONFIG.name}
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl md:text-5xl">
          More Than Learning.
          <span className="mt-1 block text-indigo-700">A Launchpad for What Comes Next.</span>
        </h2>
      </Reveal>

      <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:gap-4 md:grid-cols-2 lg:grid-cols-12">
        {FEATURES.map((feature, index) => {
          const Icon = feature.icon
          const isHandsOn = feature.id === 'hands-on'
          const isEcosystem = feature.id === 'ecosystem'

          return (
            <Reveal
              key={feature.id}
              as="li"
              delayMs={index * 80}
              className={cn('h-full min-w-0', feature.span)}
            >
              <article
                className={cn(
                  'group relative h-full overflow-hidden rounded-3xl border border-slate-200/80 p-5 transition-all duration-300 ease-out sm:p-6 lg:p-8',
                  'hover:-translate-y-1 hover:shadow-[0_24px_50px_-28px_rgba(79,70,229,0.45)]',
                  feature.article,
                )}
              >
                {isHandsOn ? (
                  <>
                    <Image
                      src="/robofest/builathon.jpeg"
                      alt=""
                      fill
                      className="object-cover opacity-35 transition-transform duration-700 ease-out group-hover:scale-105"
                      sizes="(max-width: 1024px) 100vw, 60vw"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/80 to-slate-950/40" />
                    <div
                      className="bg-tech-grid pointer-events-none absolute inset-0 opacity-40"
                      aria-hidden
                    />
                    <div
                      className="pointer-events-none absolute -right-10 -bottom-16 h-56 w-56 rounded-full bg-indigo-500/30 blur-3xl transition-transform duration-700 group-hover:scale-110"
                      aria-hidden
                    />
                    <div
                      className="pointer-events-none absolute top-10 right-8 h-32 w-32 rounded-full bg-sky-400/20 blur-2xl"
                      aria-hidden
                    />
                  </>
                ) : null}

                {feature.id === 'olympiad' ? (
                  <div
                    className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-indigo-400/20 blur-2xl"
                    aria-hidden
                  />
                ) : null}

                <div
                  className={cn(
                    'relative flex h-full',
                    isHandsOn
                      ? 'flex-col justify-end'
                      : isEcosystem
                        ? 'flex-col sm:flex-row sm:items-center sm:gap-10'
                        : 'flex-col',
                  )}
                >
                  <div
                    className={cn(
                      'mb-4 flex size-12 items-center justify-center rounded-2xl ring-1 transition-colors duration-300 sm:size-14',
                      isHandsOn
                        ? 'bg-white/10 text-sky-200 ring-white/15 group-hover:bg-indigo-500 group-hover:text-white'
                        : 'bg-slate-50 text-indigo-600 ring-slate-200/80 group-hover:bg-indigo-50 group-hover:ring-indigo-200',
                    )}
                  >
                    <Icon className="size-6" />
                  </div>

                  <div className="relative min-w-0 flex-1">
                    <h3
                      className={cn(
                        'font-semibold tracking-tight',
                        isHandsOn ? 'text-2xl sm:text-3xl lg:text-4xl' : 'text-lg sm:text-xl',
                      )}
                    >
                      {feature.title}
                    </h3>
                    <p
                      className={cn(
                        'mt-2 max-w-xl leading-relaxed',
                        isHandsOn
                          ? 'text-sm text-slate-200 sm:text-base'
                          : 'text-sm text-gray-600 sm:text-[15px]',
                      )}
                    >
                      {feature.description}
                    </p>
                    <p
                      className={cn(
                        'mt-3 text-sm transition-opacity duration-300',
                        isHandsOn ? 'text-sky-200/90' : 'text-indigo-700/80',
                        'opacity-100 lg:opacity-0 lg:group-hover:opacity-100',
                      )}
                    >
                      {feature.extra}
                    </p>
                    {feature.id === 'mentors' ? (
                      <div className="mt-5 flex items-center">
                        {['bg-indigo-200', 'bg-sky-200', 'bg-violet-200', 'bg-indigo-300'].map(
                          (color, i) => (
                            <span
                              key={color}
                              className={cn('size-9 rounded-full ring-2 ring-white', color)}
                              style={{ marginLeft: i === 0 ? 0 : -8 }}
                              aria-hidden
                            />
                          ),
                        )}
                        <span className="ml-3 text-xs font-medium text-gray-500">
                          Coaches & alumni mentors
                        </span>
                      </div>
                    ) : null}
                  </div>

                  {isEcosystem ? (
                    <ul className="mt-5 flex flex-wrap gap-2 sm:mt-0 sm:justify-end">
                      {ECOSYSTEM_TAGS.map((tag) => (
                        <li
                          key={tag}
                          className="rounded-full border border-indigo-100 bg-indigo-50/70 px-3 py-1 text-xs font-semibold text-indigo-700"
                        >
                          {tag}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </article>
            </Reveal>
          )
        })}
      </ul>
    </div>
  )
}
