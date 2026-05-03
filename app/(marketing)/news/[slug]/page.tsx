import Link from 'next/link'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArrowLeft, Calendar, Newspaper } from 'lucide-react'
import { SITE_CONFIG } from '@/lib/site-config'
import { NEWS_ARTICLE_IMAGES_PREVIEW_MAX } from '@/lib/media-gallery'
import { effectiveNewsDisplayRaw } from '@/lib/publicContentDates'
import ArticleCoverLightbox from '@/components/ArticleCoverLightbox'
import ImageLightboxGallery from '@/components/ImageLightboxGallery'
import { getNewsArticleBySlug } from '../actions'

export const revalidate = 300

type Props = { params: Promise<{ slug: string }> }

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

  const extraImages = article.images?.filter(Boolean) ?? []
  const displayLabel = formatDate(effectiveNewsDisplayRaw(article))
  const totalWithCover = (article.coverImageUrl ? 1 : 0) + extraImages.length
  const moreThanFourImages = totalWithCover > 4

  return (
    <article className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <Link
          href="/news"
          prefetch={false}
          className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to news
        </Link>

        {displayLabel ? (
          <p className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <Calendar className="w-4 h-4" />
            {displayLabel}
          </p>
        ) : null}

        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-8">
          {article.title}
        </h1>

        {article.coverImageUrl ? (
          <ArticleCoverLightbox coverUrl={article.coverImageUrl} extraUrls={extraImages} />
        ) : null}

        <div className="prose prose-lg max-w-none">
          <p className="whitespace-pre-wrap text-gray-800 leading-relaxed text-base sm:text-lg">
            {article.body}
          </p>
        </div>

        {extraImages.length > 0 ? (
          <div className="mt-12">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-indigo-600" />
              Gallery
            </h2>
            <ImageLightboxGallery
              images={extraImages}
              maxGridImages={moreThanFourImages ? NEWS_ARTICLE_IMAGES_PREVIEW_MAX : undefined}
              viewAllHref={moreThanFourImages ? `/news/${article.slug}/photos` : undefined}
              showViewAllLink={moreThanFourImages}
              viewAllLabel={`See all ${totalWithCover} images`}
              aspect="video"
            />
          </div>
        ) : null}
      </div>
    </article>
  )
}
