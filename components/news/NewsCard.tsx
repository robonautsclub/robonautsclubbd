import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import type { NewsArticle } from '@/types/news'
import { effectiveNewsDisplayRaw } from '@/lib/publicContentDates'
import { excerptBody, formatNewsDate, newsArticleHref, newsDateTimeAttr } from '@/lib/news-ui'
import NewsCoverFallback from '@/components/news/NewsCoverFallback'

type Props = {
  article: NewsArticle
}

export default function NewsCard({ article }: Props) {
  const href = newsArticleHref(article)
  const dateRaw = effectiveNewsDisplayRaw(article)
  const dateLabel = formatNewsDate(dateRaw)
  const excerpt = excerptBody(article.body, 110)

  return (
    <Link
      href={href}
      prefetch={false}
      className="group flex h-full flex-col rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
    >
      <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition-all duration-300 ease-out motion-reduce:transition-none hover:-translate-y-[3px] hover:border-indigo-200 hover:shadow-[0_20px_40px_-24px_rgba(79,70,229,0.35)]">
        <div className="relative aspect-video overflow-hidden bg-slate-100">
          {article.coverImageUrl ? (
            <Image
              src={article.coverImageUrl}
              alt=""
              fill
              className="object-cover transition-transform duration-500 ease-out motion-reduce:transition-none group-hover:scale-[1.03]"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <NewsCoverFallback size="card" />
          )}
        </div>
        <div className="flex flex-1 flex-col p-5 sm:p-6">
          {dateLabel ? (
            <time
              dateTime={newsDateTimeAttr(dateRaw)}
              className="text-xs font-medium uppercase tracking-wider text-slate-500"
            >
              {dateLabel}
            </time>
          ) : null}
          <h3 className="mt-2 line-clamp-2 text-lg font-bold leading-snug text-gray-900 transition-colors duration-300 group-hover:text-indigo-700 sm:text-xl">
            {article.title}
          </h3>
          {excerpt ? (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-600">{excerpt}</p>
          ) : null}
          <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-semibold text-indigo-600">
            Read more
            <ArrowRight
              className="size-4 transition-transform duration-300 motion-reduce:transition-none group-hover:translate-x-1"
              aria-hidden
            />
          </span>
        </div>
      </article>
    </Link>
  )
}
