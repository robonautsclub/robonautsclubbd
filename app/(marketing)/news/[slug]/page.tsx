import Link from 'next/link'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { SITE_CONFIG } from '@/lib/site-config'
import { NEWS_ARTICLE_IMAGES_PREVIEW_MAX } from '@/lib/media-gallery'
import { effectiveNewsDisplayRaw } from '@/lib/publicContentDates'
import { collectArticleImageUrls, formatNewsDate, newsDateTimeAttr } from '@/lib/news-ui'
import ArticleCoverLightbox from '@/components/ArticleCoverLightbox'
import ArticleGallery from '@/components/news/ArticleGallery'
import NewsCoverFallback from '@/components/news/NewsCoverFallback'
import { getNewsArticleBySlug } from '../actions'

export const revalidate = 1800

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = await getNewsArticleBySlug(slug)
  if (!article) {
    return { title: 'Article' }
  }
  return {
    title: article.title,
    description: article.body.slice(0, 160).replace(/\s+/g, ' ').trim(),
    openGraph: {
      title: `${article.title} | ${SITE_CONFIG.name}`,
      description: article.body.slice(0, 160).replace(/\s+/g, ' ').trim(),
      url: `/news/${article.slug}`,
      images: article.coverImageUrl ? [{ url: article.coverImageUrl }] : undefined,
    },
    alternates: {
      canonical: `/news/${article.slug}`,
    },
  }
}

export default async function NewsArticlePage({ params }: Props) {
  const { slug } = await params
  const article = await getNewsArticleBySlug(slug)
  if (!article) notFound()

  const extraImages = (article.images ?? []).filter(
    (u): u is string => typeof u === 'string' && Boolean(u.trim()),
  )
  const dateRaw = effectiveNewsDisplayRaw(article)
  const displayLabel = formatNewsDate(dateRaw)
  const allUrls = collectArticleImageUrls(article)
  const totalWithCover = allUrls.length
  const moreThanFourImages = totalWithCover > NEWS_ARTICLE_IMAGES_PREVIEW_MAX
  const photosHref = `/news/${article.slug}/photos`
  const extraPhotoCount = Math.max(0, totalWithCover - 1)

  return (
    <article className="min-h-screen bg-linear-to-b from-slate-50 via-white to-slate-50/80">
      <div className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <Link
          href="/news"
          prefetch={false}
          className="inline-flex items-center gap-2 rounded-md text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to News
        </Link>

        <header className="mt-8 sm:mt-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-indigo-600 sm:text-xs">
            Robonauts News
          </p>
          {displayLabel ? (
            <time
              dateTime={newsDateTimeAttr(dateRaw)}
              className="mt-3 block text-xs font-medium uppercase tracking-wider text-slate-500 sm:text-sm"
            >
              {displayLabel}
            </time>
          ) : null}
          <h1 className="mt-3 max-w-4xl text-3xl font-extrabold tracking-tight text-gray-900 sm:mt-4 sm:text-4xl md:text-[2.75rem] md:leading-[1.15]">
            {article.title}
          </h1>
        </header>

        <div className="mt-8 sm:mt-10">
          {article.coverImageUrl ? (
            <ArticleCoverLightbox
              coverUrl={article.coverImageUrl}
              extraUrls={extraImages}
              photoCountLabel={
                extraPhotoCount > 0
                  ? `+${extraPhotoCount} photo${extraPhotoCount === 1 ? '' : 's'}`
                  : undefined
              }
            />
          ) : (
            <div className="relative mb-8 aspect-16/10 overflow-hidden rounded-2xl border border-slate-200/80 sm:aspect-2/1 sm:rounded-3xl md:mb-10">
              <NewsCoverFallback size="cover" />
            </div>
          )}
        </div>

        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_11rem] lg:gap-12 xl:gap-16">
          <div className="min-w-0">
            <div className="mx-auto max-w-[48rem] lg:mx-0">
              <p className="whitespace-pre-wrap text-base leading-[1.8] text-gray-800 sm:text-lg sm:leading-[1.85]">
                {article.body}
              </p>
            </div>

            {extraImages.length > 0 ? (
              <ArticleGallery
                images={extraImages}
                totalWithCover={totalWithCover}
                viewAllHref={moreThanFourImages ? photosHref : undefined}
              />
            ) : null}
          </div>

          <aside className="mt-10 hidden border-l border-slate-200/80 pl-6 lg:mt-0 lg:block">
            <div className="sticky top-28 space-y-6">
              {displayLabel ? (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Published
                  </p>
                  <p className="mt-1.5 text-sm font-medium text-gray-800">{displayLabel}</p>
                </div>
              ) : null}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Robonauts
                </p>
                <p className="mt-1.5 text-sm font-medium text-gray-800">News &amp; Community</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </article>
  )
}
