'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type LightboxPortalProps = {
  images: string[]
  openIndex: number | null
  onClose: () => void
  setOpenIndex: React.Dispatch<React.SetStateAction<number | null>>
}

export function LightboxPortal({ images, openIndex, onClose, setOpenIndex }: LightboxPortalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const prevFocusRef = useRef<HTMLElement | null>(null)
  const total = images.length

  const go = useCallback(
    (delta: number) => {
      setOpenIndex((i) => {
        if (i === null || total === 0) return i
        return (i + delta + total) % total
      })
    },
    [total, setOpenIndex]
  )

  useEffect(() => {
    if (openIndex === null) return
    prevFocusRef.current = document.activeElement as HTMLElement | null
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') go(-1)
      if (e.key === 'ArrowRight') go(1)
    }
    window.addEventListener('keydown', onKey)
    overlayRef.current?.focus()

    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      prevFocusRef.current?.focus?.()
    }
  }, [openIndex, onClose, go])

  if (openIndex === null || !images[openIndex]) return null

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Image ${openIndex + 1} of ${total}`}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 sm:p-8"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-[60] rounded-full bg-white/10 p-2 text-white hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        aria-label="Close"
      >
        <X className="w-6 h-6" />
      </button>

      {total > 1 ? (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              go(-1)
            }}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-[60] rounded-full bg-white/10 p-2 sm:p-3 text-white hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              go(1)
            }}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-[60] rounded-full bg-white/10 p-2 sm:p-3 text-white hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>
        </>
      ) : null}

      <div
        className="relative max-h-[85vh] max-w-[min(100%,1200px)] w-full h-[min(85vh,800px)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- large modal uses native img for simplicity */}
        <img
          src={images[openIndex]}
          alt=""
          className="max-h-full max-w-full w-auto h-auto object-contain mx-auto"
        />
      </div>

      {total > 1 ? (
        <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/80">
          {openIndex + 1} / {total}
        </p>
      ) : null}
    </div>
  )
}

type Aspect = 'square' | 'video'

type Props = {
  /** URLs shown in the grid and navigable in the lightbox for this section */
  images: string[]
  /** If set and images.length exceeds this, only this many thumbnails are shown plus a “view all” link */
  maxGridImages?: number
  viewAllHref?: string
  viewAllLabel?: string
  /** When true with viewAllHref, show the link even if images.length <= maxGridImages (e.g. cover counts toward total elsewhere) */
  showViewAllLink?: boolean
  aspect?: Aspect
  className?: string
}

export default function ImageLightboxGallery({
  images,
  maxGridImages,
  viewAllHref,
  viewAllLabel,
  showViewAllLink = false,
  aspect = 'square',
  className,
}: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const close = useCallback(() => {
    setOpenIndex(null)
  }, [])

  const hasCap = typeof maxGridImages === 'number' && maxGridImages > 0
  const cappedByCount = hasCap && images.length > maxGridImages!
  const applyPreviewCap = hasCap && (cappedByCount || showViewAllLink)
  const gridImages = applyPreviewCap ? images.slice(0, maxGridImages!) : images
  const totalShown = gridImages.length
  const showLink = Boolean(viewAllHref && (cappedByCount || showViewAllLink))

  if (images.length === 0) return null

  const aspectClass = aspect === 'video' ? 'aspect-video' : 'aspect-square'

  return (
    <div className={cn('space-y-4', className)}>
      <div
        className={cn(
          'grid gap-2 sm:gap-3',
          aspect === 'square'
            ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
            : 'grid-cols-1 sm:grid-cols-2'
        )}
      >
        {gridImages.map((url, i) => (
          <button
            key={`${url}-${i}`}
            type="button"
            onClick={() => setOpenIndex(i)}
            className={cn(
              'relative rounded-xl overflow-hidden bg-gray-200 border border-gray-200 shadow-sm text-left',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
              'hover:opacity-95 transition-opacity group',
              aspectClass
            )}
            aria-label={`Open image ${i + 1} of ${totalShown}`}
          >
            <Image
              src={url}
              alt=""
              fill
              className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
              sizes={
                aspect === 'square'
                  ? '(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw'
                  : '(max-width: 640px) 100vw, 50vw'
              }
            />
          </button>
        ))}
      </div>

      {showLink ? (
        <Link
          href={viewAllHref!}
          prefetch={false}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 transition-colors"
        >
          {viewAllLabel ?? `See all ${images.length} images`}
        </Link>
      ) : null}

      <LightboxPortal
        images={gridImages}
        openIndex={openIndex}
        onClose={close}
        setOpenIndex={setOpenIndex}
      />
    </div>
  )
}
