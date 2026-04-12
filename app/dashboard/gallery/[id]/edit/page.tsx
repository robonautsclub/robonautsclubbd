import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { getGalleryGroupForDashboard } from '../../actions'
import GalleryGroupForm from '../../GalleryGroupForm'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> }

export default async function EditGalleryPage({ params }: Props) {
  await requireAuth()
  const { id } = await params
  const group = await getGalleryGroupForDashboard(id)
  if (!group) notFound()

  return (
    <div className="max-w-7xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit album</h2>
      <GalleryGroupForm group={group} />
    </div>
  )
}
