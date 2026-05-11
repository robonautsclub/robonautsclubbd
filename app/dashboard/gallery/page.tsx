import Link from 'next/link'
import Image from 'next/image'
import { requireAuth } from '@/lib/auth'
import { Images, Plus, ExternalLink, MapPin, Calendar } from 'lucide-react'
import { effectiveGalleryDisplayRaw } from '@/lib/publicContentDates'
import { getGalleryGroupsForDashboard } from './actions'
import DeleteGalleryButton from './DeleteGalleryButton'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

function formatListDate(raw: string | Date | null) {
  if (raw == null) return ''
  try {
    const d = typeof raw === 'string' ? new Date(raw) : raw
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d)
  } catch {
    return ''
  }
}

export default async function DashboardGalleryPage() {
  await requireAuth()
  const groups = await getGalleryGroupsForDashboard()

  return (
    <div className="max-w-7xl space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Gallery</h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Organize photo albums with a title and location</p>
        </div>
        <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
          <Link href="/dashboard/gallery/new" prefetch={false}>
            <Plus className="w-4 h-4" />
            New album
          </Link>
        </Button>
      </div>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Images className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600 mb-6">No albums yet.</p>
            <Button asChild variant="link" className="text-indigo-600 hover:text-indigo-700 h-auto p-0">
              <Link href="/dashboard/gallery/new" prefetch={false}>
                Create the first album
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-4">
          {groups.map((g) => {
            const listDate = formatListDate(effectiveGalleryDisplayRaw(g))
            return (
            <li key={g.id}>
              <Card className="overflow-hidden shadow-sm p-0">
                <div className="p-4 sm:p-5 flex flex-col lg:flex-row gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded">#{g.sortOrder}</span>
                      <h3 className="font-semibold text-gray-900 text-lg">{g.title}</h3>
                    </div>
                    {g.location ? (
                      <p className="text-sm text-gray-600 flex items-start gap-2 mb-3">
                        <MapPin className="w-4 h-4 shrink-0 text-indigo-600 mt-0.5" />
                        <span className="whitespace-pre-wrap">{g.location}</span>
                      </p>
                    ) : null}
                    <p className="text-sm text-gray-500">{g.images.length} image{g.images.length === 1 ? '' : 's'}</p>
                    {listDate ? (
                      <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        {listDate}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0 items-start">
                    <Button asChild variant="outline" size="sm" className="text-gray-700 bg-gray-50 hover:bg-gray-100 hover:text-gray-700">
                      <Link
                        href="/gallery"
                        prefetch={false}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Public gallery
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="text-indigo-700 bg-indigo-50 border-indigo-200 hover:bg-indigo-100 hover:text-indigo-700">
                      <Link href={`/dashboard/gallery/${g.id}/edit`} prefetch={false}>
                        Edit
                      </Link>
                    </Button>
                    <DeleteGalleryButton id={g.id} title={g.title} />
                  </div>
                </div>
                {g.images.length > 0 ? (
                  <div className="px-4 sm:px-5 pb-4 flex gap-2 overflow-x-auto">
                    {g.images.slice(0, 8).map((img) => (
                      <div key={img.url} className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-100">
                        <Image src={img.url} alt="" fill className="object-cover" sizes="80px" />
                      </div>
                    ))}
                    {g.images.length > 8 ? (
                      <div className="w-20 h-20 shrink-0 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                        +{g.images.length - 8}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </Card>
            </li>
          )})}
        </ul>
      )}
    </div>
  )
}
