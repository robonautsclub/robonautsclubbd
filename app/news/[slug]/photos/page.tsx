import Link from 'next/link'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArrowLeft, Images } from 'lucide-react'
import { SITE_CONFIG } from '@/lib/site-config'
import { getNewsArticleBySlug } from '../../actions'
import ImageLightboxGallery from '@/components/ImageLightboxGallery'

export const revalidate = 300

type Props = { params: Promise<{ slug: string }> }

function collectArticleImageUrls(article: {
  coverImageUrl?: string
  images?: string[]
}): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  if (article.coverImageUrl?.trim()) {
    const u = article.coverImageUrl.trim()
    seen.add(u)
    out.push(u)
  }
  for (const raw of article.images ?? []) {
    if (typeof raw !== 'string' || !raw.trim()) continue
    const u = raw.trim()
    if (seen.has(u)) continue
    seen.add(u)
    out.push(u)
  }
  return out
}

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <Link
          href={`/news/${article.slug}`}
          prefetch={false}
          className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to article
        </Link>

        <div className="mb-8 sm:mb-10">
          <div className="flex items-center gap-2 text-indigo-600 mb-2">
            <Images className="w-5 h-5" />
            <span className="text-sm font-medium">Photos</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">{article.title}</h1>
          <p className="mt-2 text-sm text-gray-500">{urls.length} image{urls.length === 1 ? '' : 's'}</p>
        </div>

        <ImageLightboxGallery images={urls} aspect="video" />
      </div>
    </div>
  )
}
