import Link from 'next/link'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArrowLeft, Calendar, Images, MapPin } from 'lucide-react'
import { SITE_CONFIG } from '@/lib/site-config'
import { effectiveGalleryDisplayRaw } from '@/lib/publicContentDates'
import RoboHudHero from '@/components/RoboHudHero'
import ImageLightboxGallery from '@/components/ImageLightboxGallery'
import { getPublicGalleryGroupById } from '../../actions'

export const revalidate = 1800

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
    <div className="flex min-h-screen flex-col bg-linear-to-b from-slate-50 via-white to-slate-50/80">
      <RoboHudHero compact align="left">
        <Link
          href="/gallery"
          prefetch={false}
          className="inline-flex items-center gap-2 rounded-md text-sm font-medium text-sky-200 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to gallery
        </Link>

        <div className="mt-6 sm:mt-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-white/5 px-3 py-1.5 backdrop-blur-sm">
            <Images className="size-3.5 text-cyan-200" aria-hidden />
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-100 sm:text-xs">
              Album
            </span>
          </div>
          <h1 className="max-w-4xl text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">
            {group.title}
          </h1>
          <div className="mt-3 flex flex-col gap-2 text-sm text-sky-100/90 sm:mt-4 sm:text-base">
            {dateLine ? (
              <p className="flex items-center gap-2">
                <Calendar className="size-4 shrink-0 text-cyan-200" aria-hidden />
                {dateLine}
              </p>
            ) : null}
            {group.location ? (
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-cyan-200" aria-hidden />
                <span className="whitespace-pre-wrap">{group.location}</span>
              </p>
            ) : null}
            <p className="text-sky-200/80">
              {urls.length} photo{urls.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>
      </RoboHudHero>

      <main className="relative flex-1 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-linear-to-b from-indigo-50/50 to-transparent"
          aria-hidden
        />
        <div className="relative z-10 mx-auto max-w-7xl">
          {urls.length === 0 ? (
            <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-12 text-center shadow-sm sm:p-16">
              <div className="bg-tech-grid-ink pointer-events-none absolute inset-0 opacity-60" aria-hidden />
              <div className="relative z-10">
                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-indigo-50 ring-1 ring-indigo-100">
                  <Images className="size-7 text-indigo-400" aria-hidden />
                </div>
                <p className="text-base font-medium text-gray-700">No images in this album yet.</p>
              </div>
            </div>
          ) : (
            <ImageLightboxGallery
              images={urls}
              aspect="square"
              className="[&_button]:rounded-2xl [&_button]:border-slate-200/80 [&_button]:shadow-sm [&_button]:ring-1 [&_button]:ring-slate-900/5 hover:[&_button]:ring-cyan-400/30"
            />
          )}
        </div>
      </main>
    </div>
  )
}
