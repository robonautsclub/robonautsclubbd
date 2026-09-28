import Link from 'next/link'
import Image from 'next/image'
import { Calendar, Images, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GalleryGroup } from '@/types/gallery'

type Props = {
  group: GalleryGroup
  dateLine?: string
  featured?: boolean
}

export default function GalleryAlbumCard({ group, dateLine = '', featured = false }: Props) {
  const cover = group.images[0]?.url
  const stack = group.images.slice(1, 4).map((img) => img.url)
  const photoCount = group.images.length

  return (
    <Link
      href={`/gallery/album/${group.id}`}
      prefetch={false}
      className={cn(
        'group relative flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm',
        'transition-all duration-300 ease-out motion-reduce:transition-none',
        'hover:-translate-y-0.75 hover:border-cyan-300/60 hover:shadow-[0_24px_50px_-28px_rgba(6,182,212,0.45)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2',
        featured && 'lg:min-h-88',
      )}
    >
      <div
        className={cn(
          'relative overflow-hidden bg-slate-900',
          featured ? 'aspect-16/10 sm:aspect-21/10 lg:aspect-auto lg:flex-1 lg:min-h-64' : 'aspect-4/3',
        )}
      >
        {cover ? (
          <Image
            src={cover}
            alt=""
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            sizes={
              featured
                ? '(max-width: 1024px) 100vw, 66vw'
                : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
            }
          />
        ) : (
          <div className="absolute inset-0 bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900" aria-hidden>
            <div className="bg-tech-grid absolute inset-0 opacity-50" />
            <div className="bg-circuit-dots absolute inset-0 opacity-40" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Images className="size-12 text-cyan-200/50 sm:size-14" />
            </div>
          </div>
        )}

        <div
          className="pointer-events-none absolute inset-0 bg-linear-to-t from-slate-950/90 via-slate-950/25 to-transparent"
          aria-hidden
        />

        {stack.length > 0 ? (
          <div className="absolute top-3 right-3 flex -space-x-2 sm:top-4 sm:right-4" aria-hidden>
            {stack.map((url, i) => (
              <span
                key={`${url}-${i}`}
                className="relative size-9 overflow-hidden rounded-lg border-2 border-white/80 shadow-md sm:size-11"
                style={{ zIndex: stack.length - i }}
              >
                <Image src={url} alt="" fill className="object-cover" sizes="44px" />
              </span>
            ))}
          </div>
        ) : null}

        <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full border border-cyan-300/30 bg-slate-950/55 px-2.5 py-1 text-[11px] font-semibold text-cyan-50 backdrop-blur-sm sm:bottom-4 sm:left-4 sm:text-xs">
          <Images className="size-3.5 shrink-0 text-cyan-200" aria-hidden />
          {photoCount} photo{photoCount === 1 ? '' : 's'}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
        <h2
          className={cn(
            'font-bold tracking-tight text-gray-900 transition-colors group-hover:text-indigo-700',
            featured ? 'text-xl sm:text-2xl line-clamp-2' : 'text-lg sm:text-xl line-clamp-2',
          )}
        >
          {group.title}
        </h2>
        {dateLine ? (
          <p className="flex items-center gap-1.5 text-xs text-gray-500 sm:text-sm">
            <Calendar className="size-3.5 shrink-0 text-indigo-500" aria-hidden />
            <span className="truncate">{dateLine}</span>
          </p>
        ) : null}
        {group.location ? (
          <p className="flex items-start gap-1.5 text-xs text-gray-500 sm:text-sm">
            <MapPin className="mt-0.5 size-3.5 shrink-0 text-indigo-500" aria-hidden />
            <span className="line-clamp-2 whitespace-pre-wrap">{group.location}</span>
          </p>
        ) : null}
      </div>
    </Link>
  )
}
