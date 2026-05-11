'use client'

import { useMemo, useState, useCallback } from 'react'
import Image from 'next/image'
import { LightboxPortal } from '@/components/ImageLightboxGallery'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type Props = {
  coverUrl: string
  /** Extra gallery image URLs (cover is index 0 in the lightbox when extras exist) */
  extraUrls: string[]
}

export default function ArticleCoverLightbox({ coverUrl, extraUrls }: Props) {
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

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        onClick={() => setOpenIndex(0)}
        className="relative block w-full h-auto p-0 aspect-video rounded-2xl overflow-hidden bg-gray-200 mb-10 shadow-md text-left group hover:bg-gray-200"
        aria-label={slideshowUrls.length > 1 ? 'Open image viewer (cover and gallery)' : 'Open full image'}
      >
        <Image
          src={coverUrl}
          alt=""
          fill
          className="object-cover group-hover:opacity-95 transition-opacity"
          priority
          sizes="(max-width: 768px) 100vw, 48rem"
        />
        <Badge className="absolute bottom-3 right-3 bg-black/50 hover:bg-black/50 text-white border-0 text-xs font-medium pointer-events-none">
          Click to enlarge
        </Badge>
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
