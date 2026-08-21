import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

type CourseCardProps = {
  title: string
  level: string
  blurb: string
  href?: string
  img?: string
}

export default function CourseCard({
  title,
  level,
  blurb,
  href = '#',
  img,
}: CourseCardProps) {
  const getLevelColor = (levelText: string) => {
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

  return (
    <Link href={href} prefetch={false} className="h-full block">
      <article className="group relative h-full flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-[0_12px_28px_-16px_rgba(79,70,229,0.35)]">
        <div className="relative h-36 sm:h-48 bg-linear-to-br from-slate-100 via-indigo-50 to-sky-50 overflow-hidden">
          {img ? (
            <>
              <Image
                src={img}
                alt={title}
                fill
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                quality={80}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-linear-to-t from-slate-900/25 via-transparent to-transparent" />
            </>
          ) : null}
          <Badge
            variant="outline"
            className={`absolute top-2 right-2 sm:top-3 sm:right-3 z-10 px-2.5 py-1 text-xs font-semibold backdrop-blur-sm shadow-sm ${getLevelColor(level)}`}
          >
            {level}
          </Badge>
        </div>

        <div className="p-4 sm:p-6 flex flex-col flex-1">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1.5 sm:mb-2 group-hover:text-indigo-700 transition-colors duration-300 line-clamp-2 leading-snug">
            {title}
          </h3>
          <p className="hidden sm:block text-gray-600 mb-4 flex-1 line-clamp-3 leading-relaxed text-sm">
            {blurb}
          </p>

          <div className="mt-auto pt-3 border-t border-slate-100 group-hover:border-indigo-100 transition-colors">
            <div className="flex items-center gap-2 text-indigo-600 font-medium text-sm">
              <span>Learn More</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}
