'use client'

import { useState } from 'react'
import Image from 'next/image'
import InfiniteMarquee from '@/components/InfiniteMarquee'
import Reveal from '@/components/Reveal'
import type { NamedLogo } from '@/components/PartnerShowcase'

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function SchoolMark({ name, logo }: NamedLogo) {
  const [failed, setFailed] = useState(false)
  const showImage = Boolean(logo) && !failed

  return (
    <div className="relative size-12 shrink-0 sm:size-14">
      {showImage ? (
        <Image
          src={logo!}
          alt={`${name} logo`}
          fill
          className="object-contain"
          quality={90}
          sizes="56px"
          onError={() => setFailed(true)}
        />
      ) : (
        <span
          className="flex size-full items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-700"
          aria-hidden
        >
          {getInitials(name)}
        </span>
      )}
    </div>
  )
}

function SchoolChip({ name, logo }: NamedLogo) {
  return (
    <div className="flex shrink-0 items-center gap-3 rounded-full border border-slate-200/80 bg-white px-4 py-2.5 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.35)]">
      <SchoolMark name={name} logo={logo} />
      <span className="max-w-56 truncate text-sm font-semibold text-gray-800">{name}</span>
    </div>
  )
}

export default function SchoolReachShowcase({ items }: { items: NamedLogo[] }) {
  if (items.length === 0) return null

  const rowA = items.filter((_, i) => i % 2 === 0)
  const rowB = items.filter((_, i) => i % 2 === 1)
  const useMarquee = items.length >= 4

  return (
    <div className="relative">
      <div
        className="bg-circuit-dots pointer-events-none absolute inset-0 opacity-70 mask-[radial-gradient(ellipse_at_center,black,transparent_75%)]"
        aria-hidden
      />

      <Reveal className="relative mx-auto mb-8 max-w-2xl text-center sm:mb-12">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-indigo-600 sm:text-xs">
          Schools
        </p>
        <h3 className="mt-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl md:text-4xl">
          Taking Innovation Beyond Our Walls
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-gray-600 sm:text-base">
          Through seminars, workshops, and hands-on experiences, we bring future-ready learning
          to schools across our community.
        </p>
      </Reveal>

      {useMarquee ? (
        <div className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 space-y-3">
          <InfiniteMarquee duration={34} fadeClassName="from-indigo-50/90">
            {(rowA.length > 0 ? rowA : items).map((item, index) => (
              <SchoolChip key={`${item.name}-a-${index}`} {...item} />
            ))}
          </InfiniteMarquee>
          {rowB.length > 0 ? (
            <InfiniteMarquee reverse duration={42} fadeClassName="from-indigo-50/90">
              {rowB.map((item, index) => (
                <SchoolChip key={`${item.name}-b-${index}`} {...item} />
              ))}
            </InfiniteMarquee>
          ) : null}
        </div>
      ) : (
        <ul className="relative mx-auto flex max-w-4xl list-none flex-wrap justify-center gap-3 p-0">
          {items.map((item, index) => (
            <li key={`${item.name}-${index}`}>
              <SchoolChip {...item} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
