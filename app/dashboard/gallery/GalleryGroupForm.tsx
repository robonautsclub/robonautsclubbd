'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import Image from 'next/image'
import Link from 'next/link'
import { createGalleryGroup, updateGalleryGroup } from './actions'
import type { GalleryGroup } from '@/types/gallery'
import { galleryGroupFormSchema, type GalleryGroupFormValues } from '@/lib/validation/gallery'
import { ArrowLeft, Calendar, Images, Loader2, MapPin, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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

  const [images, setImages] = useState<{ url: string }[]>(group?.images ?? [])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const form = useForm<GalleryGroupFormValues>({
    resolver: standardSchemaResolver(galleryGroupFormSchema),
    defaultValues: {
      title: group?.title ?? '',
      location: group?.location ?? '',
      sortOrder: group?.sortOrder ?? 0,
      displayDateInput:
        group ? isoOrDateToYmd(group.displayDate ?? group.createdAt) || todayLocalYmd() : todayLocalYmd(),
    },
  })

  const loading = form.formState.isSubmitting

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
      setUploadError(problems.join('. '))
      e.target.value = ''
      return
    }

    setUploadError('')
    setUploading(true)
    const added: { url: string }[] = []
    try {
      for (const file of files) {
        const url = await uploadFile(file)
        added.push({ url })
      }
      setImages((prev) => [...prev, ...added])
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const removeImage = (url: string) => {
    setImages((prev) => prev.filter((i) => i.url !== url))
  }

  const onSubmit = async (values: GalleryGroupFormValues) => {
    setUploadError('')
    try {
      if (isEdit && group) {
        await updateGalleryGroup(group.id, {
          title: values.title,
          location: values.location,
          sortOrder: values.sortOrder,
          images,
          displayDate: values.displayDateInput,
        })
      } else {
        await createGalleryGroup({
          title: values.title,
          location: values.location,
          sortOrder: values.sortOrder,
          images,
          displayDate: values.displayDateInput,
        })
      }
      router.push('/dashboard/gallery')
      router.refresh()
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
        <Link
          href="/dashboard/gallery"
          prefetch={false}
          className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to gallery
        </Link>

        {(uploadError || form.formState.errors.root?.message) && (
          <Alert variant="destructive">
            <AlertDescription>{uploadError || form.formState.errors.root?.message}</AlertDescription>
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
                Shown on the public gallery. If cleared, today&apos;s date is used when you save.
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
              <FormLabel>Album title</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-600" />
                Location
              </FormLabel>
              <FormControl>
                <Textarea rows={3} placeholder="Venue, city, or address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sortOrder"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sort order</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  className="w-32"
                  value={Number.isFinite(field.value) ? field.value : 0}
                  onChange={(e) => {
                    const raw = e.target.value
                    field.onChange(raw === '' ? 0 : parseInt(raw, 10) || 0)
                  }}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              </FormControl>
              <p className="text-xs text-gray-500">Lower numbers appear first on the public gallery page.</p>
              <FormMessage />
            </FormItem>
          )}
        />

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
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? 'Uploading…' : 'Upload images'}
          </Button>
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
            <p className="text-sm text-gray-500">
              No images yet — upload at least one for the album to look good on the site.
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isEdit ? 'Save album' : 'Create album'}
          </Button>
          <Link
            href="/dashboard/gallery"
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
