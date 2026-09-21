'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

type LightboxPortalProps = {
  images: string[]
  openIndex: number | null
  onClose: () => void
  setOpenIndex: React.Dispatch<React.SetStateAction<number | null>>
}

export function LightboxPortal({ images, openIndex, onClose, setOpenIndex }: LightboxPortalProps) {
  const total = images.length
  const isOpen = openIndex !== null

  const go = useCallback(
    (delta: number) => {
      setOpenIndex((i) => {
        if (i === null || total === 0) return i
        return (i + delta + total) % total
      })
    },
    [total, setOpenIndex]
  )

  // Dialog handles Escape and focus trap. We only need ArrowLeft/Right for nav.
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') go(-1)
      if (e.key === 'ArrowRight') go(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, go])

  if (!isOpen || !images[openIndex]) return null

  const label = `Image ${openIndex + 1} of ${total}`

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="z-[80] bg-black/90"
        className={cn(
          'fixed inset-0 top-0 left-0 z-[80] flex h-dvh max-h-dvh w-screen max-w-none sm:max-w-none',
          'translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0',
          'bg-transparent p-0 shadow-none focus:outline-none',
          'data-[state=closed]:zoom-out-100 data-[state=open]:zoom-in-100',
        )}
      >
        <DialogTitle className="sr-only">{label}</DialogTitle>
        <DialogDescription className="sr-only">
          Full-size gallery image. Use arrow keys to navigate between photos.
        </DialogDescription>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 z-50 rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </Button>

        {total > 1 ? (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                go(-1)
              }}
              className="absolute left-2 sm:left-4 top-1/2 z-50 size-12 -translate-y-1/2 rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                go(1)
              }}
              className="absolute right-2 sm:right-4 top-1/2 z-50 size-12 -translate-y-1/2 rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
            </Button>
          </>
        ) : null}

        {/* min-h-0 so tall/portrait images can shrink inside the viewport */}
        <div className="flex min-h-0 w-full flex-1 items-center justify-center px-3 pb-12 pt-14 sm:px-10 sm:pb-14 sm:pt-12">
          {/* eslint-disable-next-line @next/next/no-img-element -- large modal uses native img for simplicity */}
          <img
            src={images[openIndex]}
            alt=""
            className="h-auto max-h-full w-auto max-w-full object-contain"
          />
        </div>

        {total > 1 ? (
          <p className="pointer-events-none absolute bottom-4 left-1/2 z-50 -translate-x-1/2 text-sm text-white/80">
            {openIndex + 1} / {total}
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

type Aspect = 'square' | 'video'

type Props = {
  /** URLs shown in the grid and navigable in the lightbox for this section */
  images: string[]
  /** If set and images.length exceeds this, only this many thumbnails are shown plus a "view all" link */
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
          <Button
            key={`${url}-${i}`}
            type="button"
            variant="ghost"
            onClick={() => setOpenIndex(i)}
            className={cn(
              'relative h-auto p-0 rounded-xl overflow-hidden bg-gray-200 border border-gray-200 shadow-sm text-left',
              'hover:opacity-95 hover:bg-gray-200 transition-opacity group',
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
          </Button>
        ))}
      </div>

      {showLink ? (
        <Button
          asChild
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
        >
          <Link href={viewAllHref!} prefetch={false}>
            {viewAllLabel ?? `See all ${images.length} images`}
          </Link>
        </Button>
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
