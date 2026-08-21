'use client'

import { useMemo, useState, useCallback } from 'react'
import Image from 'next/image'
import { LightboxPortal } from '@/components/ImageLightboxGallery'
import { Button } from '@/components/ui/button'

type Props = {
  coverUrl: string
  /** Extra gallery image URLs (cover is index 0 in the lightbox when extras exist) */
  extraUrls: string[]
  /** Optional label when more photos exist beyond the cover */
  photoCountLabel?: string
}

export default function ArticleCoverLightbox({ coverUrl, extraUrls, photoCountLabel }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const close = useCallback(() => setOpenIndex(null), [])

  const slideshowUrls = useMemo(() => {
    const seen = new Set<string>()
    const out: string[] = []
    const push = (u: string) => {
      const t = u.trim()
      if (!t || seen.has(t)) return
      seen.add(t)
      out.push(t)
    }
    push(coverUrl)
    for (const u of extraUrls) {
      if (typeof u === 'string') push(u)
    }
    return out
  }, [coverUrl, extraUrls])

  const hasExtras = slideshowUrls.length > 1

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        onClick={() => setOpenIndex(0)}
        className="group relative mb-8 block aspect-16/10 h-auto w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100 p-0 text-left shadow-sm hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-indigo-500 sm:aspect-2/1 sm:rounded-3xl md:mb-10"
        aria-label={hasExtras ? 'Open image viewer (cover and gallery)' : 'Open full image'}
      >
        <Image
          src={coverUrl}
          alt=""
          fill
          className="object-cover transition-transform duration-500 ease-out motion-reduce:transition-none group-hover:scale-[1.02]"
          priority
          sizes="(max-width: 768px) 100vw, 1100px"
        />
        <span
          className="pointer-events-none absolute inset-0 bg-linear-to-t from-slate-950/35 via-transparent to-transparent opacity-80"
          aria-hidden
        />
        {photoCountLabel ? (
          <span className="absolute bottom-3 right-3 rounded-full bg-slate-950/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm ring-1 ring-white/15 sm:bottom-4 sm:right-4 sm:text-sm">
            {photoCountLabel}
          </span>
        ) : hasExtras ? (
          <span className="absolute bottom-3 right-3 rounded-full bg-slate-950/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm ring-1 ring-white/15 sm:bottom-4 sm:right-4">
            Click to enlarge
          </span>
        ) : (
          <span className="absolute bottom-3 right-3 rounded-full bg-slate-950/60 px-3 py-1.5 text-xs font-medium text-white/95 backdrop-blur-sm ring-1 ring-white/15 sm:bottom-4 sm:right-4">
            Click to enlarge
          </span>
        )}
      </Button>

      <LightboxPortal
        images={slideshowUrls}
        openIndex={openIndex}
        onClose={close}
        setOpenIndex={setOpenIndex}
      />
    </>
  )
}
