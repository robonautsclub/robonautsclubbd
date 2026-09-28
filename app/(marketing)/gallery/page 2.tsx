import { Metadata } from 'next'
import { Images } from 'lucide-react'
import { PAGE_SEO, buildPageMetadata } from '@/lib/seo-metadata'
import { effectiveGalleryDisplayRaw } from '@/lib/publicContentDates'
import RoboHudHero from '@/components/RoboHudHero'
import GalleryAlbumCard from '@/components/gallery/GalleryAlbumCard'
import { getGalleryGroups } from './actions'

export const metadata: Metadata = buildPageMetadata({
  title: PAGE_SEO.gallery.title,
  description: PAGE_SEO.gallery.description,
  path: '/gallery',
  absoluteTitle: true,
  ogImage: {
    url: '/robofest/robofest.jpg',
    width: 1200,
    height: 630,
    alt: 'Robonauts Gallery',
  },
})

export const revalidate = 1800

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

export default async function GalleryPage() {
  const groups = await getGalleryGroups()
  const albumCount = groups.length
  const photoCount = groups.reduce((sum, g) => sum + g.images.length, 0)

  return (
    <div className="flex min-h-screen flex-col bg-linear-to-b from-slate-50 via-white to-slate-50/80">
      <RoboHudHero>
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-white/5 px-3 py-1.5 shadow-[0_0_24px_rgba(34,211,238,0.15)] backdrop-blur-sm sm:mb-5 sm:px-4">
          <Images className="size-3.5 text-cyan-200 sm:size-4" aria-hidden />
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-100 sm:text-xs">
            Robogallery
          </span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">Gallery</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-sky-100/90 sm:mt-4 sm:text-base md:text-lg">
          Snapshots from workshops, competitions, and community events.
        </p>
        {albumCount > 0 ? (
          <p className="mt-5 inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs font-medium text-cyan-100/80 sm:mt-6 sm:text-sm">
            <span>
              {albumCount} album{albumCount === 1 ? '' : 's'}
            </span>
            <span className="hidden text-cyan-300/40 sm:inline" aria-hidden>
              ·
            </span>
            <span>
              {photoCount} photo{photoCount === 1 ? '' : 's'}
            </span>
          </p>
        ) : null}
      </RoboHudHero>

      <main className="relative flex-1 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-linear-to-b from-indigo-50/50 to-transparent"
          aria-hidden
        />
        <div className="relative z-10 mx-auto max-w-7xl">
          {groups.length === 0 ? (
            <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-12 text-center shadow-sm sm:p-16">
              <div className="bg-tech-grid-ink pointer-events-none absolute inset-0 opacity-60" aria-hidden />
              <div className="relative z-10">
                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-indigo-50 ring-1 ring-indigo-100">
                  <Images className="size-7 text-indigo-400" aria-hidden />
                </div>
                <p className="text-base font-medium text-gray-700 sm:text-lg">No gallery albums yet.</p>
                <p className="mt-2 text-sm text-gray-500">Check back soon for moments from the lab and stage.</p>
              </div>
            </div>
          ) : (
            <ul className="m-0 grid list-none grid-cols-1 gap-6 p-0 sm:grid-cols-2 sm:gap-7 lg:grid-cols-3 lg:gap-8">
              {groups.map((group, index) => {
                const dateLine = formatDisplayDate(effectiveGalleryDisplayRaw(group))
                const featured = index === 0
                return (
                  <li key={group.id} className={featured ? 'sm:col-span-2 lg:col-span-2' : 'min-w-0'}>
                    <GalleryAlbumCard group={group} dateLine={dateLine} featured={featured} />
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
