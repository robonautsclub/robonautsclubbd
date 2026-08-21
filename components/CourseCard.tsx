import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type CourseCardProps = {
  title: string
  level: string
  blurb: string
  href?: string
  img?: string
  variant?: 'default' | 'featured'
}

function getLevelColor(levelText: string) {
  const lower = levelText.toLowerCase()
  if (lower.includes('beginner') || lower.includes('junior') || lower.includes('all')) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
  }
  if (lower.includes('intermediate') || lower.includes('senior')) {
    return 'bg-sky-50 text-sky-700 border-sky-200/80'
  }
  if (lower.includes('advanced')) {
    return 'bg-indigo-50 text-indigo-700 border-indigo-200/80'
  }
  return 'bg-slate-50 text-slate-700 border-slate-200/80'
}

export default function CourseCard({
  title,
  level,
  blurb,
  href = '#',
  img,
  variant = 'default',
}: CourseCardProps) {
  const featured = variant === 'featured'
  const shortBlurb = !blurb || blurb.trim().length < 80

  if (featured) {
    return (
      <Link href={href} prefetch={false} className="block h-full">
        <article className="group relative grid h-full overflow-hidden rounded-3xl border border-slate-200/80 bg-white transition-all duration-300 ease-out hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_24px_50px_-28px_rgba(79,70,229,0.4)] lg:grid-cols-[1.15fr_0.85fr]">
          <div className="relative min-h-52 overflow-hidden bg-linear-to-br from-slate-100 via-indigo-50 to-sky-50 sm:min-h-64 lg:min-h-[22rem]">
            {img ? (
              <>
                <Image
                  src={img}
                  alt={title}
                  fill
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  quality={80}
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-linear-to-t from-slate-950/40 via-transparent to-transparent lg:bg-linear-to-r lg:from-transparent lg:to-slate-950/10" />
              </>
            ) : null}
            <Badge
              variant="outline"
              className={cn(
                'absolute top-3 left-3 z-10 px-2.5 py-1 text-xs font-semibold shadow-sm backdrop-blur-sm',
                getLevelColor(level),
              )}
            >
              {level}
            </Badge>
          </div>

          <div className="flex flex-col justify-center p-5 sm:p-7 lg:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-600">
              Featured program
            </p>
            <h3 className="mt-2 text-2xl font-semibold leading-snug text-gray-900 transition-colors duration-300 group-hover:text-indigo-700 sm:text-3xl">
              {title}
            </h3>
            {blurb ? (
              <p
                className={cn(
                  'mt-3 leading-relaxed text-gray-600',
                  shortBlurb ? 'text-base' : 'line-clamp-3 text-sm sm:text-base',
                )}
              >
                {blurb}
              </p>
            ) : null}
            <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-indigo-600">
              <span>Explore this program</span>
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </div>
          </div>
        </article>
      </Link>
    )
  }

  return (
    <Link href={href} prefetch={false} className="block h-full">
      <article
        className={cn(
          'group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white transition-all duration-300 ease-out',
          'hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_24px_50px_-28px_rgba(79,70,229,0.4)]',
        )}
      >
        <div className="relative h-36 overflow-hidden bg-linear-to-br from-slate-100 via-indigo-50 to-sky-50 sm:h-40">
          {img ? (
            <>
              <Image
                src={img}
                alt={title}
                fill
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                quality={80}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-linear-to-t from-slate-950/35 via-transparent to-transparent" />
            </>
          ) : null}
          <Badge
            variant="outline"
            className={cn(
              'absolute top-3 right-3 z-10 px-2.5 py-1 text-xs font-semibold shadow-sm backdrop-blur-sm',
              getLevelColor(level),
            )}
          >
            {level}
          </Badge>
        </div>

        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <h3 className="line-clamp-2 text-base font-semibold leading-snug text-gray-900 transition-colors duration-300 group-hover:text-indigo-700 sm:text-lg">
            {title}
          </h3>
          {blurb ? (
            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-gray-600">{blurb}</p>
          ) : null}

          <div className="mt-auto flex items-center gap-2 pt-3 text-sm font-semibold text-indigo-600">
            <span>Learn more</span>
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
          </div>
        </div>
      </article>
    </Link>
  )
}
