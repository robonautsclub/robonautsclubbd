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
      return 'bg-blue-100 text-blue-700 border-blue-200'
    }
    if (lower.includes('advanced')) {
      return 'bg-purple-100 text-purple-700 border-purple-200'
    }
    // Default for "For All" or other cases
    return 'bg-indigo-100 text-indigo-700 border-indigo-200'
  }

  return (
    <Link href={href}>
      <div className="group relative bg-white rounded-2xl border-2 border-gray-200 hover:border-indigo-300 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col">
        {/* Image Section */}
        <div className="relative h-48 bg-gradient-to-br from-indigo-500 via-blue-500 to-purple-500 overflow-hidden">
          {img ? (
            <>
              <Image
                src={img}
                alt={title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
            </>
          ) : (
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
          )}
          {/* Level Badge */}
          <div className="absolute top-4 right-4 z-10">
            <span
              className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm border ${getLevelColor(level)}`}
            >
              {level}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 flex flex-col flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2">
            {title}
          </h3>
          <p className="text-gray-600 mb-4 flex-1 line-clamp-3">{blurb}</p>

          {/* CTA Button */}
          <div className="mt-auto pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-indigo-600 font-semibold group-hover:text-indigo-700 transition-colors">
              <span>Learn More</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

