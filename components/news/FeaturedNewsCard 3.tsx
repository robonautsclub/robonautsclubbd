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

export default function FeaturedNewsCard({ article }: Props) {
  const href = newsArticleHref(article)
  const dateLabel = formatNewsDate(effectiveNewsDisplayRaw(article))
  const excerpt = excerptBody(article.body, 180)

  return (
    <Link
      href={href}
      prefetch={false}
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded-3xl"
    >
      <article className="grid overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 ease-out motion-reduce:transition-none hover:-translate-y-[3px] hover:border-indigo-200 hover:shadow-[0_24px_50px_-28px_rgba(79,70,229,0.35)] lg:grid-cols-[1.35fr_1fr]">
        <div className="relative aspect-16/10 overflow-hidden bg-slate-100 sm:aspect-3/2 lg:aspect-auto lg:min-h-[22rem]">
          {article.coverImageUrl ? (
            <Image
              src={article.coverImageUrl}
              alt={article.title}
              fill
              priority
              className="object-cover transition-transform duration-500 ease-out motion-reduce:transition-none group-hover:scale-[1.03]"
              sizes="(max-width: 1024px) 100vw, 58vw"
            />
          ) : (
            <NewsCoverFallback size="featured" />
          )}
          <div
            className="absolute inset-0 bg-linear-to-t from-slate-950/25 via-transparent to-transparent lg:bg-linear-to-r lg:from-transparent lg:to-slate-950/5"
            aria-hidden
          />
        </div>

        <div className="flex flex-col justify-center p-5 sm:p-7 lg:p-9 xl:p-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-600">
            Featured story
          </p>
          {dateLabel ? (
            <time
              dateTime={newsDateTimeAttr(effectiveNewsDisplayRaw(article))}
              className="mt-3 text-xs font-medium uppercase tracking-wider text-slate-500"
            >
              {dateLabel}
            </time>
          ) : null}
          <h2 className="mt-2 text-2xl font-bold leading-snug tracking-tight text-gray-900 transition-colors duration-300 group-hover:text-indigo-700 sm:text-3xl lg:text-[2rem] lg:leading-tight">
            {article.title}
          </h2>
          {excerpt ? (
            <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-gray-600 sm:text-base">
              {excerpt}
            </p>
          ) : null}
          <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600">
            Read story
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
