'use client'

import { useState, FormEvent, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createNewsArticle, updateNewsArticle } from './actions'
import type { NewsArticle } from '@/types/news'
import { slugifyForUrl } from '@/lib/multilingualText'
import { ArrowLeft, Calendar, ImageIcon, Loader2, Plus, Trash2, Upload } from 'lucide-react'

type Props = {
  article?: NewsArticle | null
}

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

export default function NewsArticleForm({ article }: Props) {
  const router = useRouter()
  const coverInputRef = useRef<HTMLInputElement>(null)
  const extraInputRef = useRef<HTMLInputElement>(null)
  const isEdit = Boolean(article)

  const [loading, setLoading] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingExtra, setUploadingExtra] = useState(false)
  const [error, setError] = useState('')

  const [title, setTitle] = useState(article?.title ?? '')
  const [slugOverride, setSlugOverride] = useState(article?.slug ?? '')
  const [body, setBody] = useState(article?.body ?? '')
  const [coverImageUrl, setCoverImageUrl] = useState(article?.coverImageUrl ?? '')
  const [images, setImages] = useState<string[]>(article?.images ?? [])
  const [published, setPublished] = useState(article?.published ?? false)
  const [displayDateInput, setDisplayDateInput] = useState(() => {
    if (article) {
      return isoOrDateToYmd(article.displayDate ?? article.publishedAt ?? article.createdAt) || todayLocalYmd()
    }
    return todayLocalYmd()
  })

  const suggestedSlug = slugifyForUrl(title.trim() || slugOverride.trim() || 'article')

  const uploadFile = async (file: File) => {
    const uploadFormData = new FormData()
    uploadFormData.append('image', file)
    uploadFormData.append('folder', 'news')
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

  const onCoverSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setUploadingCover(true)
    try {
      const url = await uploadFile(file)
      setCoverImageUrl(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cover upload failed')
    } finally {
      setUploadingCover(false)
      if (coverInputRef.current) coverInputRef.current.value = ''
    }
  }

  const onExtraSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setUploadingExtra(true)
    try {
      const url = await uploadFile(file)
      setImages((prev) => [...prev, url])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image upload failed')
    } finally {
      setUploadingExtra(false)
      if (extraInputRef.current) extraInputRef.current.value = ''
    }
  }

  const removeExtra = (url: string) => {
    setImages((prev) => prev.filter((u) => u !== url))
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isEdit && article) {
        await updateNewsArticle(article.id, {
          title,
          slug: slugOverride.trim() || undefined,
          body,
          coverImageUrl: coverImageUrl || undefined,
          images,
          published,
          displayDate: displayDateInput,
        })
        router.push('/dashboard/news')
        router.refresh()
      } else {
        await createNewsArticle({
          title,
          slug: slugOverride.trim() || undefined,
          body,
          coverImageUrl: coverImageUrl || undefined,
          images,
          published,
          displayDate: displayDateInput,
        })
        router.push('/dashboard/news')
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-3xl">
      <Link
        href="/dashboard/news"
        prefetch={false}
        className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to news
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
        <p className="text-xs text-gray-500 mt-1">
          Shown on the public news page and used for sorting. If empty when publishing, today&apos;s date is used.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          URL slug <span className="text-gray-400 font-normal">(optional — leave blank to derive from title)</span>
        </label>
        <input
          type="text"
          value={slugOverride}
          onChange={(e) => setSlugOverride(e.target.value)}
          placeholder={suggestedSlug}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
        <p className="text-xs text-gray-500 mt-1">Public URL: /news/{slugOverride.trim() ? slugifyForUrl(slugOverride) : suggestedSlug}</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Article</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={14}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-sans"
          required
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
        <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-indigo-600" />
          Cover image
        </p>
        <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={onCoverSelect} />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            disabled={uploadingCover}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {uploadingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Upload cover
          </button>
          {coverImageUrl ? (
            <button type="button" onClick={() => setCoverImageUrl('')} className="text-sm text-red-600 hover:underline">
              Remove cover
            </button>
          ) : null}
        </div>
        {coverImageUrl ? (
          <div className="relative w-full max-w-md aspect-video rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
            <Image src={coverImageUrl} alt="" fill className="object-cover" sizes="(max-width: 448px) 100vw, 448px" />
          </div>
        ) : null}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
        <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
          <Plus className="w-4 h-4 text-indigo-600" />
          Extra photos (shown below the article)
        </p>
        <input ref={extraInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={onExtraSelect} />
        <button
          type="button"
          onClick={() => extraInputRef.current?.click()}
          disabled={uploadingExtra}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-800 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
        >
          {uploadingExtra ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          Add image
        </button>
        {images.length > 0 ? (
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            {images.map((url) => (
              <li key={url} className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 group border border-gray-200">
                <Image src={url} alt="" fill className="object-cover" sizes="200px" />
                <button
                  type="button"
                  onClick={() => removeExtra(url)}
                  className="absolute top-2 right-2 p-1.5 rounded-md bg-red-600 text-white opacity-90 hover:opacity-100 shadow"
                  aria-label="Remove image"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
        <span className="text-sm font-medium text-gray-800">Published (visible on public news page)</span>
      </label>

      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {isEdit ? 'Save changes' : 'Create article'}
        </button>
        <Link
          href="/dashboard/news"
          prefetch={false}
          className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg border border-gray-300 text-gray-800 font-medium hover:bg-gray-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}
