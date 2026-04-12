'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteGalleryGroup } from './actions'
import { Trash2, Loader2 } from 'lucide-react'

export default function DeleteGalleryButton({ id, title }: { id: string; title: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const onClick = async () => {
    if (!confirm(`Delete album “${title}”? This cannot be undone.`)) return
    setLoading(true)
    try {
      await deleteGalleryGroup(id)
      router.refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Delete failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 disabled:opacity-50"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
      Delete
    </button>
  )
}
