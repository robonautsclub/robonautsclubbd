'use client'

import { useCallback, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { LightboxPortal } from '@/components/ImageLightboxGallery'

type Props = {
  images: string[]
  className?: string
}

/** Immersive full-album grid for `/news/[slug]/photos`. */
export default function NewsPhotosGrid({ images, className }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const close = useCallback(() => setOpenIndex(null), [])

  if (images.length === 0) return null

  return (
    <div className={cn('space-y-4', className)}>
      <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {images.map((url, i) => {
          const tall = i % 5 === 1 || i % 5 === 3
          return (
            <li
              key={`${url}-${i}`}
              className={cn(tall && 'sm:row-span-1', tall && 'lg:min-h-0')}
            >
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpenIndex(i)}
                className={cn(
                  'group relative h-auto w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100 p-0 text-left shadow-sm',
                  'hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-indigo-500',
                  tall ? 'aspect-4/5 sm:aspect-3/4' : 'aspect-video sm:aspect-4/3',
                )}
                aria-label={`Open image ${i + 1} of ${images.length}`}
              >
                <Image
                  src={url}
                  alt=""
                  fill
                  className="object-cover transition-transform duration-500 ease-out motion-reduce:transition-none group-hover:scale-[1.03]"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <span
                  className="pointer-events-none absolute inset-0 bg-slate-950/0 transition-colors duration-300 group-hover:bg-slate-950/10"
                  aria-hidden
                />
              </Button>
            </li>
          )
        })}
      </ul>

      <LightboxPortal
        images={images}
        openIndex={openIndex}
        onClose={close}
        setOpenIndex={setOpenIndex}
      />
    </div>
  )
}
