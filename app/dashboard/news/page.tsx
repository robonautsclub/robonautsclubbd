import Link from 'next/link'
import Image from 'next/image'
import { requireAuth } from '@/lib/auth'
import { Newspaper, Plus, ExternalLink, Calendar } from 'lucide-react'
import { effectiveNewsDisplayRaw } from '@/lib/publicContentDates'
import { getNewsArticles } from './actions'
import DeleteNewsButton from './DeleteNewsButton'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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

export default async function DashboardNewsPage() {
  await requireAuth()
  const articles = await getNewsArticles()

  return (
    <div className="max-w-7xl space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">News</h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Create and publish club news articles</p>
        </div>
        <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
          <Link href="/dashboard/news/new" prefetch={false}>
            <Plus className="w-4 h-4" />
            New article
          </Link>
        </Button>
      </div>

      {articles.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Newspaper className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600 mb-6">No articles yet.</p>
            <Button asChild variant="link" className="text-indigo-600 hover:text-indigo-700 h-auto p-0">
              <Link href="/dashboard/news/new" prefetch={false}>
                Write the first article
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden shadow-sm p-0">
          <ul className="divide-y divide-gray-100">
            {articles.map((a) => {
              const listDate = formatListDate(effectiveNewsDisplayRaw(a))
              return (
              <li key={a.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="relative w-full sm:w-28 h-20 shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-100">
                  {a.coverImageUrl ? (
                    <Image src={a.coverImageUrl} alt="" fill className="object-cover" sizes="112px" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                      <Newspaper className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">{a.title}</h3>
                    {a.published ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">Published</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100">Draft</Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 font-mono truncate">/news/{a.slug}</p>
                  {listDate ? (
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      {listDate}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {a.published ? (
                    <Button asChild variant="outline" size="sm" className="text-gray-700 bg-gray-50 hover:bg-gray-100 hover:text-gray-700">
                      <Link
                        href={`/news/${a.slug}`}
                        prefetch={false}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View
                      </Link>
                    </Button>
                  ) : null}
                  <Button asChild variant="outline" size="sm" className="text-indigo-700 bg-indigo-50 border-indigo-200 hover:bg-indigo-100 hover:text-indigo-700">
                    <Link href={`/dashboard/news/${a.id}/edit`} prefetch={false}>
                      Edit
                    </Link>
                  </Button>
                  <DeleteNewsButton id={a.id} title={a.title} />
                </div>
              </li>
            )})}
          </ul>
        </Card>
      )}
    </div>
  )
}
