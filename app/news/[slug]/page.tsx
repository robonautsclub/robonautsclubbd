import Image from 'next/image'
import Link from 'next/link'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArrowLeft, Calendar, Newspaper } from 'lucide-react'
import { SITE_CONFIG } from '@/lib/site-config'
import { effectiveNewsDisplayRaw } from '@/lib/publicContentDates'
import { getNewsArticleBySlug } from '../actions'

export const revalidate = 60

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

  return (
    <article className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <Link
          href="/news"
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
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-200 mb-10 shadow-md">
            <Image
              src={article.coverImageUrl}
              alt=""
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 48rem"
            />
          </div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {extraImages.map((url) => (
                <div
                  key={url}
                  className="relative aspect-video rounded-xl overflow-hidden bg-gray-200 border border-gray-200"
                >
                  <Image src={url} alt="" fill className="object-cover" sizes="(max-width: 640px) 100vw, 50vw" />
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </article>
  )
}
