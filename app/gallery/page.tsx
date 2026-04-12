import { Metadata } from 'next'
import { Calendar, Images, MapPin } from 'lucide-react'
import { SITE_CONFIG } from '@/lib/site-config'
import { effectiveGalleryDisplayRaw } from '@/lib/publicContentDates'
import { GALLERY_ALBUM_PREVIEW_MAX } from '@/lib/media-gallery'
import ImageLightboxGallery from '@/components/ImageLightboxGallery'
import { getGalleryGroups } from './actions'

export const metadata: Metadata = {
  title: 'Gallery',
  description: `Photo gallery from ${SITE_CONFIG.name} events and activities.`,
  openGraph: {
    title: `Gallery | ${SITE_CONFIG.name}`,
    description: `Photos from ${SITE_CONFIG.name} events and activities.`,
    url: '/gallery',
  },
  alternates: {
    canonical: '/gallery',
  },
}

export const revalidate = 60

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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <section
        className="relative text-white py-16 sm:py-20 md:py-24 px-4 sm:px-6 overflow-hidden"
        style={{
          backgroundImage: "url('/robobanner.gif')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-slate-900/55" />
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm mb-4">
            <Images className="w-4 h-4" />
            <span className="text-xs sm:text-sm font-medium">Moments</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Gallery
          </h1>
          <p className="text-base sm:text-lg text-blue-100 max-w-2xl mx-auto">
            Snapshots from workshops, competitions, and community events.
          </p>
        </div>
      </section>

      <main className="flex-1 py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-16 sm:space-y-20">
          {groups.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-600">
              <Images className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No gallery albums yet.</p>
            </div>
          ) : (
            groups.map((group) => {
              const dateLine = formatDisplayDate(effectiveGalleryDisplayRaw(group))
              return (
              <section key={group.id} className="scroll-mt-24">
                <div className="mb-6 sm:mb-8">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{group.title}</h2>
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
                </div>
                {group.images.length === 0 ? (
                  <p className="text-gray-500 text-sm">No images in this album yet.</p>
                ) : (
                  <ImageLightboxGallery
                    images={group.images.map((img) => img.url)}
                    maxGridImages={GALLERY_ALBUM_PREVIEW_MAX}
                    viewAllHref={`/gallery/album/${group.id}`}
                    viewAllLabel={`See all ${group.images.length} images`}
                    aspect="square"
                  />
                )}
              </section>
            )})
          )}
        </div>
      </main>
    </div>
  )
}
