import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { getNewsArticleForDashboard } from '../../actions'
import NewsArticleForm from '../../NewsArticleForm'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> }

export default async function EditNewsPage({ params }: Props) {
  await requireAuth()
  const { id } = await params
  const article = await getNewsArticleForDashboard(id)
  if (!article) notFound()

  return (
    <div className="max-w-7xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit article</h2>
      <NewsArticleForm article={article} />
    </div>
  )
}
