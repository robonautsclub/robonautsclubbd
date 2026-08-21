'use client'

import { useState } from 'react'
import Image from 'next/image'
import Reveal from '@/components/Reveal'
import { cn } from '@/lib/utils'

export type NamedLogo = { name: string; logo?: string }

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function PartnerLogo({ name, logo }: NamedLogo) {
  const [failed, setFailed] = useState(false)
  const showImage = Boolean(logo) && !failed

  return (
    <div className="relative mx-auto h-14 w-full max-w-36 sm:h-16">
      {showImage ? (
        <Image
          src={logo!}
          alt={`${name} logo`}
          fill
          className="object-contain opacity-70 grayscale transition-all duration-300 group-hover:opacity-100 group-hover:grayscale-0"
          quality={90}
          sizes="144px"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full items-center justify-center">
          <span className="text-sm font-semibold tracking-wide text-indigo-600/80">
            {getInitials(name)}
          </span>
        </div>
      )}
    </div>
  )
}

export default function PartnerShowcase({ items }: { items: NamedLogo[] }) {
  if (items.length === 0) return null

  return (
    <div className="flex flex-col items-center">
      <Reveal className="mb-8 max-w-2xl text-center sm:mb-12">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-indigo-600 sm:text-xs">
          Partners
        </p>
        <h3 className="mt-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl md:text-4xl">
          Our Strategic Partners
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-gray-600 sm:text-base">
          Trusted by organizations who believe in the future of learning.
        </p>
      </Reveal>

      <ul
        className={cn(
          'grid w-full list-none justify-items-center gap-x-6 gap-y-8 p-0 sm:gap-x-10 sm:gap-y-10',
          items.length <= 3
            ? 'grid-cols-2 sm:grid-cols-3'
            : items.length <= 6
              ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
              : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6',
        )}
      >
        {items.map((item, index) => (
          <Reveal key={`${item.name}-${index}`} as="li" delayMs={index * 50} className="w-full">
            <div className="group flex flex-col items-center gap-3 px-2 py-3 text-center">
              <PartnerLogo name={item.name} logo={item.logo} />
              <span className="text-xs font-medium text-gray-500 transition-colors duration-300 group-hover:text-gray-800 sm:text-sm">
                {item.name}
              </span>
            </div>
          </Reveal>
        ))}
      </ul>
    </div>
  )
}
