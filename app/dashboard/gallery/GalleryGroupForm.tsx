'use client'

import { useState, FormEvent, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createGalleryGroup, updateGalleryGroup } from './actions'
import type { GalleryGroup } from '@/types/gallery'
import { ArrowLeft, Calendar, Images, Loader2, MapPin, Trash2, Upload } from 'lucide-react'

type Props = {
  group?: GalleryGroup | null
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const MAX_FILE_SIZE = 5 * 1024 * 1024

function isoOrDateToYmd(v: string | Date | null | undefined): string {
  if (v == null || v === '') return ''
  const d = typeof v === 'string' ? new Date(v) : v
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}

function todayLocalYmd() {
  const t = new Date()
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
}

export default function GalleryGroupForm({ group }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isEdit = Boolean(group)

  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const [title, setTitle] = useState(group?.title ?? '')
  const [location, setLocation] = useState(group?.location ?? '')
  const [sortOrder, setSortOrder] = useState(group?.sortOrder ?? 0)
  const [images, setImages] = useState<{ url: string }[]>(group?.images ?? [])
  const [displayDateInput, setDisplayDateInput] = useState(() => {
    if (group) {
      return isoOrDateToYmd(group.displayDate ?? group.createdAt) || todayLocalYmd()
    }
    return todayLocalYmd()
  })

  const uploadFile = async (file: File) => {
    const uploadFormData = new FormData()
    uploadFormData.append('image', file)
    uploadFormData.append('folder', 'gallery')
    const response = await fetch('/api/upload-image', {
      method: 'POST',
      body: uploadFormData,
      credentials: 'include',
    })
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || 'Upload failed')
    }
    return data.secure_url as string
  }

  const onFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return

    const problems: string[] = []
    for (const file of files) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        problems.push(`${file.name}: invalid type`)
      }
      if (file.size > MAX_FILE_SIZE) {
        problems.push(`${file.name}: exceeds 5MB`)
      }
    }
    if (problems.length > 0) {
      setError(problems.join('. '))
      e.target.value = ''
      return
    }

    setError('')
    setUploading(true)
    const added: { url: string }[] = []
    try {
      for (const file of files) {
        const url = await uploadFile(file)
        added.push({ url })
      }
      setImages((prev) => [...prev, ...added])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const removeImage = (url: string) => {
    setImages((prev) => prev.filter((i) => i.url !== url))
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isEdit && group) {
        await updateGalleryGroup(group.id, {
          title,
          location,
          sortOrder,
          images,
          displayDate: displayDateInput,
        })
      } else {
        await createGalleryGroup({
          title,
          location,
          sortOrder,
          images,
          displayDate: displayDateInput,
        })
      }
      router.push('/dashboard/gallery')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-3xl">
      <Link
        href="/dashboard/gallery"
        prefetch={false}
        className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to gallery
      </Link>

      {error ? (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3">{error}</div>
      ) : null}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-600" />
          Display date
        </label>
        <input
          type="date"
          value={displayDateInput}
          onChange={(e) => setDisplayDateInput(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
        <p className="text-xs text-gray-500 mt-1">Shown on the public gallery. If cleared, today&apos;s date is used when you save.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Album title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-indigo-600" />
          Location
        </label>
        <textarea
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          rows={3}
          placeholder="Venue, city, or address"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Sort order</label>
        <input
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
          className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
        <p className="text-xs text-gray-500 mt-1">Lower numbers appear first on the public gallery page.</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
        <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
          <Images className="w-4 h-4 text-indigo-600" />
          Photos
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={onFileSelect}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? 'Uploading…' : 'Upload images'}
        </button>
        <p className="text-xs text-gray-500">You can select multiple files at once.</p>
        {images.length > 0 ? (
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            {images.map((img) => (
              <li key={img.url} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group border border-gray-200">
                <Image src={img.url} alt="" fill className="object-cover" sizes="150px" />
                <button
                  type="button"
                  onClick={() => removeImage(img.url)}
                  className="absolute top-2 right-2 p-1.5 rounded-md bg-red-600 text-white opacity-90 hover:opacity-100 shadow"
                  aria-label="Remove image"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No images yet — upload at least one for the album to look good on the site.</p>
        )}
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {isEdit ? 'Save album' : 'Create album'}
        </button>
        <Link
          href="/dashboard/gallery"
          prefetch={false}
          className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg border border-gray-300 text-gray-800 font-medium hover:bg-gray-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}
