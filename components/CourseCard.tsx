import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

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
  // Determine badge color based on level text
  const getLevelColor = (levelText: string) => {
    const lower = levelText.toLowerCase()
    if (lower.includes('beginner') || lower.includes('junior') || lower.includes('all')) {
      return 'bg-green-100 text-green-700 border-green-200'
    }
    if (lower.includes('intermediate') || lower.includes('senior')) {
      return 'bg-blue-100 text-blue-600 border-blue-200'
    }
    if (lower.includes('advanced')) {
      return 'bg-purple-100 text-purple-600 border-purple-200'
    }
    // Default for "For All" or other cases
    return 'bg-indigo-100 text-indigo-600 border-indigo-200'
  }

  return (
    <Link href={href}>
      <div className="group relative bg-white rounded-xl sm:rounded-2xl border-2 border-gray-200 hover:border-indigo-300 overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 h-full flex flex-col transform hover:-translate-y-1 sm:hover:-translate-y-2">
        {/* Image Section - shorter on mobile */}
        <div className="relative h-36 sm:h-52 bg-linear-to-br from-indigo-400 via-blue-400 to-purple-400 overflow-hidden">
          {img ? (
            <>
              <Image
                src={img}
                alt={title}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                quality={80}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-transparent group-hover:from-black/30 transition-all duration-300" />
            </>
          ) : (
            <div className="absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-transparent group-hover:from-black/30 transition-all duration-300" />
          )}
          {/* Level Badge */}
          <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 transform group-hover:scale-110 transition-transform duration-300">
            <span
              className={`px-2.5 py-1 sm:px-4 sm:py-2 rounded-full text-xs font-bold shadow-lg border backdrop-blur-sm ${getLevelColor(level)}`}
            >
              {level}
            </span>
          </div>
        </div>

        {/* Content Section - compact on mobile */}
        <div className="p-4 sm:p-7 flex flex-col flex-1 bg-white">
          <h3 className="text-base sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3 group-hover:text-indigo-600 transition-colors duration-300 line-clamp-2 leading-tight">
            {title}
          </h3>
          <p className="hidden sm:block text-gray-600 mb-5 flex-1 line-clamp-3 leading-relaxed text-sm">{blurb}</p>

          {/* CTA Button */}
          <div className="mt-auto pt-3 sm:pt-5 border-t border-gray-100 group-hover:border-indigo-100 transition-colors">
            <div className="flex items-center gap-2 text-indigo-500 font-semibold group-hover:text-indigo-600 transition-colors text-sm sm:text-base">
              <span>Learn More</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-2 transition-transform duration-300" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

