import Link from 'next/link'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArrowLeft, Calendar, Images, MapPin } from 'lucide-react'
import { SITE_CONFIG } from '@/lib/site-config'
import { effectiveGalleryDisplayRaw } from '@/lib/publicContentDates'
import { getPublicGalleryGroupById } from '../../actions'
import ImageLightboxGallery from '@/components/ImageLightboxGallery'

export const revalidate = 60

type Props = { params: Promise<{ id: string }> }

function formatDisplayDate(iso: string | Date | null) {
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
  const { id } = await params
  const group = await getPublicGalleryGroupById(id)
  if (!group) {
    return { title: 'Album' }
  }
  return {
    title: `${group.title} — Gallery`,
    description: `Photos: ${group.title} · ${SITE_CONFIG.name}`,
    openGraph: {
      title: `${group.title} | ${SITE_CONFIG.name}`,
      url: `/gallery/album/${id}`,
    },
    alternates: {
      canonical: `/gallery/album/${id}`,
    },
  }
}

export default async function GalleryAlbumPage({ params }: Props) {
  const { id } = await params
  const group = await getPublicGalleryGroupById(id)
  if (!group) notFound()

  const urls = group.images.map((i) => i.url).filter(Boolean)
  const dateLine = formatDisplayDate(effectiveGalleryDisplayRaw(group))

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <Link
          href="/gallery"
          className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to gallery
        </Link>

        <div className="mb-8 sm:mb-10">
          <div className="flex items-center gap-2 text-indigo-600 mb-2">
            <Images className="w-5 h-5" />
            <span className="text-sm font-medium">Album</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">{group.title}</h1>
          {dateLine ? (
            <p className="mt-2 flex items-center gap-2 text-gray-600 text-sm sm:text-base">
              <Calendar className="w-5 h-5 shrink-0 text-indigo-600" />
              {dateLine}
            </p>
          ) : null}
          {group.location ? (
            <p className="mt-2 flex items-start gap-2 text-gray-600 text-sm sm:text-base">
              <MapPin className="w-5 h-5 shrink-0 text-indigo-600 mt-0.5" />
              <span className="whitespace-pre-wrap">{group.location}</span>
            </p>
          ) : null}
          <p className="mt-2 text-sm text-gray-500">{urls.length} photo{urls.length === 1 ? '' : 's'}</p>
        </div>

        {urls.length === 0 ? (
          <p className="text-gray-500">No images in this album yet.</p>
        ) : (
          <ImageLightboxGallery images={urls} aspect="square" />
        )}
      </div>
    </div>
  )
}
