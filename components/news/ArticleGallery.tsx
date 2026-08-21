'use client'

import { useCallback, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { LightboxPortal } from '@/components/ImageLightboxGallery'
import { NEWS_ARTICLE_IMAGES_PREVIEW_MAX } from '@/lib/media-gallery'

type Props = {
  images: string[]
  /** Total including cover — used for “see all N” copy */
  totalWithCover: number
  viewAllHref?: string
  className?: string
}

export default function ArticleGallery({
  images,
  totalWithCover,
  viewAllHref,
  className,
}: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const close = useCallback(() => setOpenIndex(null), [])

  if (images.length === 0) return null

  const capped = Boolean(viewAllHref && totalWithCover > NEWS_ARTICLE_IMAGES_PREVIEW_MAX)
  const gridImages = capped ? images.slice(0, NEWS_ARTICLE_IMAGES_PREVIEW_MAX) : images
  const remaining = Math.max(0, totalWithCover - gridImages.length)
  const moreLabel = remaining > 0 ? `+${remaining}` : null

  return (
    <section className={cn('mt-12 sm:mt-16', className)} aria-labelledby="article-gallery-heading">
      <div className="mb-5 sm:mb-6">
        <h2 id="article-gallery-heading" className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
          Gallery
        </h2>
        <p className="mt-1 text-sm text-slate-500">Moments from the event</p>
      </div>

      <div
        className={cn(
          'grid gap-2 sm:gap-3',
          gridImages.length === 1 && 'grid-cols-1',
          gridImages.length === 2 && 'grid-cols-1 sm:grid-cols-2',
          gridImages.length >= 3 && 'grid-cols-2 sm:grid-cols-3 sm:grid-rows-2',
        )}
      >
        {gridImages.map((url, i) => {
          const isHero = i === 0 && gridImages.length >= 3
          const isLastCapped = capped && i === gridImages.length - 1 && viewAllHref
          const cellClass = cn(
            'relative overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100 shadow-sm',
            'aspect-video',
            isHero && 'col-span-2 row-span-2 sm:aspect-auto sm:min-h-[18rem] md:min-h-[22rem]',
            !isHero && gridImages.length >= 3 && 'aspect-square sm:aspect-video',
          )

          if (isLastCapped) {
            return (
              <Link
                key={`${url}-${i}`}
                href={viewAllHref!}
                prefetch={false}
                className={cn(
                  cellClass,
                  'group/item flex flex-col items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
                )}
                aria-label={`See all ${totalWithCover} photos`}
              >
                <Image
                  src={url}
                  alt=""
                  fill
                  className="object-cover transition-transform duration-500 ease-out motion-reduce:transition-none group-hover/item:scale-[1.03]"
                  sizes="(max-width: 640px) 50vw, 33vw"
                />
                <span className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/55 text-white transition-colors duration-300 group-hover/item:bg-slate-950/65">
                  {moreLabel ? (
                    <span className="text-2xl font-bold tracking-tight sm:text-3xl">{moreLabel}</span>
                  ) : null}
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-sky-100 sm:text-sm',
                      moreLabel && 'mt-1',
                    )}
                  >
                    View all photos
                    <ArrowRight className="size-3.5" aria-hidden />
                  </span>
                </span>
              </Link>
            )
          }

          return (
            <Button
              key={`${url}-${i}`}
              type="button"
              variant="ghost"
              onClick={() => setOpenIndex(i)}
              className={cn(
                cellClass,
                'h-auto p-0 text-left hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-indigo-500 group/item',
              )}
              aria-label={`Open image ${i + 1} of ${gridImages.length}`}
            >
              <Image
                src={url}
                alt=""
                fill
                className="object-cover transition-transform duration-500 ease-out motion-reduce:transition-none group-hover/item:scale-[1.03]"
                sizes={
                  isHero
                    ? '(max-width: 640px) 100vw, 66vw'
                    : '(max-width: 640px) 50vw, 33vw'
                }
              />
            </Button>
          )
        })}
      </div>

      {capped && viewAllHref ? (
        <div className="mt-5">
          <Link
            href={viewAllHref}
            prefetch={false}
            className="inline-flex items-center gap-1.5 rounded-md text-sm font-semibold text-indigo-600 transition-colors hover:text-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            See all {totalWithCover} photos
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      ) : null}

      <LightboxPortal
        images={gridImages}
        openIndex={openIndex}
        onClose={close}
        setOpenIndex={setOpenIndex}
      />
    </section>
  )
}
