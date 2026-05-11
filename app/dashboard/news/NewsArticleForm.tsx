'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import Image from 'next/image'
import Link from 'next/link'
import { createNewsArticle, updateNewsArticle } from './actions'
import type { NewsArticle } from '@/types/news'
import { slugifyForUrl } from '@/lib/multilingualText'
import { newsArticleFormSchema, type NewsArticleFormValues } from '@/lib/validation/news'
import { ArrowLeft, Calendar, ImageIcon, Loader2, Plus, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

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

  const [images, setImages] = useState<string[]>(article?.images ?? [])
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingExtra, setUploadingExtra] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const form = useForm<NewsArticleFormValues>({
    resolver: standardSchemaResolver(newsArticleFormSchema),
    defaultValues: {
      title: article?.title ?? '',
      slugOverride: article?.slug ?? '',
      body: article?.body ?? '',
      coverImageUrl: article?.coverImageUrl ?? '',
      displayDateInput:
        article
          ? isoOrDateToYmd(article.displayDate ?? article.publishedAt ?? article.createdAt) || todayLocalYmd()
          : todayLocalYmd(),
      published: article?.published ?? false,
    },
  })

  const titleValue = form.watch('title')
  const slugOverrideValue = form.watch('slugOverride')
  const suggestedSlug = slugifyForUrl(titleValue.trim() || slugOverrideValue.trim() || 'article')

  const loading = form.formState.isSubmitting

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
    setUploadError('')
    setUploadingCover(true)
    try {
      const url = await uploadFile(file)
      form.setValue('coverImageUrl', url)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Cover upload failed')
    } finally {
      setUploadingCover(false)
      if (coverInputRef.current) coverInputRef.current.value = ''
    }
  }

  const onExtraSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError('')
    setUploadingExtra(true)
    try {
      const url = await uploadFile(file)
      setImages((prev) => [...prev, url])
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Image upload failed')
    } finally {
      setUploadingExtra(false)
      if (extraInputRef.current) extraInputRef.current.value = ''
    }
  }

  const removeExtra = (url: string) => {
    setImages((prev) => prev.filter((u) => u !== url))
  }

  const onSubmit = async (values: NewsArticleFormValues) => {
    setUploadError('')
    try {
      if (isEdit && article) {
        await updateNewsArticle(article.id, {
          title: values.title,
          slug: values.slugOverride.trim() || undefined,
          body: values.body,
          coverImageUrl: values.coverImageUrl || undefined,
          images,
          published: values.published,
          displayDate: values.displayDateInput,
        })
        router.push('/dashboard/news')
        router.refresh()
      } else {
        await createNewsArticle({
          title: values.title,
          slug: values.slugOverride.trim() || undefined,
          body: values.body,
          coverImageUrl: values.coverImageUrl || undefined,
          images,
          published: values.published,
          displayDate: values.displayDateInput,
        })
        router.push('/dashboard/news')
        router.refresh()
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  const coverImageUrl = form.watch('coverImageUrl')

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
        <Link
          href="/dashboard/news"
          prefetch={false}
          className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to news
        </Link>

        {uploadError && (
          <Alert variant="destructive">
            <AlertDescription>{uploadError}</AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="displayDateInput"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                Display date
              </FormLabel>
              <FormControl>
                <Input type="date" className="max-w-xs" {...field} />
              </FormControl>
              <p className="text-xs text-gray-500">
                Shown on the public news page and used for sorting. If empty when publishing, today&apos;s date is
                used.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slugOverride"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                URL slug <span className="text-gray-400 font-normal">(optional — leave blank to derive from title)</span>
              </FormLabel>
              <FormControl>
                <Input {...field} placeholder={suggestedSlug} />
              </FormControl>
              <p className="text-xs text-gray-500">
                Public URL: /news/{slugOverrideValue.trim() ? slugifyForUrl(slugOverrideValue) : suggestedSlug}
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="body"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Article</FormLabel>
              <FormControl>
                <Textarea rows={14} className="font-sans min-h-[320px]" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
          <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-indigo-600" />
            Cover image
          </p>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={onCoverSelect}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={uploadingCover}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {uploadingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Upload cover
            </Button>
            {coverImageUrl ? (
              <button
                type="button"
                onClick={() => form.setValue('coverImageUrl', '')}
                className="text-sm text-red-600 hover:underline"
              >
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
          <input
            ref={extraInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={onExtraSelect}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => extraInputRef.current?.click()}
            disabled={uploadingExtra}
          >
            {uploadingExtra ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Add image
          </Button>
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

        <FormField
          control={form.control}
          name="published"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Published (visible on public news page)</FormLabel>
              </div>
            </FormItem>
          )}
        />

        <div className="flex flex-wrap gap-3 pt-2">
          <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isEdit ? 'Save changes' : 'Create article'}
          </Button>
          <Link
            href="/dashboard/news"
            prefetch={false}
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg border border-gray-300 text-gray-800 font-medium hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </Form>
  )
}
