import Link from 'next/link'
import Image from 'next/image'
import { Metadata } from 'next'
import { Newspaper, ArrowRight, Calendar } from 'lucide-react'
import { SITE_CONFIG } from '@/lib/site-config'
import { effectiveNewsDisplayRaw } from '@/lib/publicContentDates'
import { getPublishedNews } from './actions'

export const metadata: Metadata = {
  title: 'News',
  description: `Updates, stories, and announcements from ${SITE_CONFIG.name}.`,
  openGraph: {
    title: `News | ${SITE_CONFIG.name}`,
    description: `Updates and stories from ${SITE_CONFIG.name}.`,
    url: '/news',
  },
  alternates: {
    canonical: '/news',
  },
}

export const revalidate = 900

function formatDate(iso: string | Date | null) {
  if (iso == null) return ''
  try {
    const d = iso instanceof Date ? iso : new Date(iso)
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d)
  } catch {
    return ''
  }
}

export default async function NewsPage() {
  const articles = await getPublishedNews()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <section
        className="relative text-white py-16 sm:py-20 md:py-24 px-4 sm:px-6 overflow-hidden"
        style={{
          backgroundImage: "url('/robobanner.gif')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-slate-900/55" />
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm mb-4">
            <Newspaper className="w-4 h-4" />
            <span className="text-xs sm:text-sm font-medium">Club news</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            News & stories
          </h1>
          <p className="text-base sm:text-lg text-blue-100 max-w-2xl mx-auto">
            Highlights from workshops, competitions, and the community.
          </p>
        </div>
      </section>

      <main className="flex-1 py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {articles.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-600">
              <Newspaper className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No published articles yet. Check back soon.</p>
            </div>
          ) : (
            <ul className="grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => {
                const dateLabel = formatDate(effectiveNewsDisplayRaw(article))
                return (
                <li key={article.id}>
                  <Link
                    href={`/news/${article.slug}`}
                    prefetch={false}
                    className="group block h-full bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md hover:border-indigo-200 transition-all"
                  >
                    <div className="aspect-video relative bg-gray-100">
                      {article.coverImageUrl ? (
                        <Image
                          src={article.coverImageUrl}
                          alt=""
                          fill
                          className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                          <Newspaper className="w-14 h-14 opacity-40" />
                        </div>
                      )}
                    </div>
                    <div className="p-5 sm:p-6">
                      {dateLabel ? (
                          <p className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                            <Calendar className="w-3.5 h-3.5 shrink-0" />
                            {dateLabel}
                          </p>
                        ) : null}
                      <h2 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                        {article.title}
                      </h2>
                      <span className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-indigo-600">
                        Read more
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </Link>
                </li>
                )
              })}
            </ul>
          )}
        </div>
      </main>
    </div>
  )
}
