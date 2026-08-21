import Link from 'next/link'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArrowLeft, Images } from 'lucide-react'
import { SITE_CONFIG } from '@/lib/site-config'
import { collectArticleImageUrls } from '@/lib/news-ui'
import { getNewsArticleBySlug } from '../../actions'
import NewsPhotosGrid from '@/components/news/NewsPhotosGrid'

export const revalidate = 1800

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = await getNewsArticleBySlug(slug)
  if (!article) {
    return { title: 'Photos' }
  }
  return {
    title: `Photos — ${article.title}`,
    description: `Images for “${article.title}” · ${SITE_CONFIG.name}`,
    openGraph: {
      title: `Photos | ${article.title}`,
      url: `/news/${article.slug}/photos`,
    },
    alternates: {
      canonical: `/news/${article.slug}/photos`,
    },
  }
}

export default async function NewsArticlePhotosPage({ params }: Props) {
  const { slug } = await params
  const article = await getNewsArticleBySlug(slug)
  if (!article) notFound()

  const urls = collectArticleImageUrls(article)
  if (urls.length === 0) notFound()

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 via-white to-slate-50/80">
      <div className="relative overflow-hidden border-b border-slate-200/70 bg-linear-to-br from-slate-950 via-indigo-950 to-slate-900 text-white">
        <div className="bg-tech-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden />
        <div className="bg-circuit-dots pointer-events-none absolute inset-0 opacity-25" aria-hidden />
        <div
          className="pointer-events-none absolute -top-20 right-0 h-56 w-56 rounded-full bg-indigo-500/25 blur-3xl"
          aria-hidden
        />

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <Link
            href={`/news/${article.slug}`}
            prefetch={false}
            className="inline-flex items-center gap-2 rounded-md text-sm font-medium text-sky-200 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back to article
          </Link>

          <div className="mt-6 sm:mt-8">
            <div className="mb-3 inline-flex items-center gap-2 text-sky-200">
              <Images className="size-4 sm:size-5" aria-hidden />
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] sm:text-xs">
                Photos
              </span>
            </div>
            <h1 className="max-w-4xl text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">
              {article.title}
            </h1>
            <p className="mt-2 text-sm text-blue-100/90 sm:text-base">
              {urls.length} photo{urls.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <NewsPhotosGrid images={urls} />
      </main>
    </div>
  )
}
