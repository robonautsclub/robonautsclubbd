'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import Image from 'next/image'
import { createCourse } from '../actions'
import { Plus, X, FileText, Image as ImageIcon, Upload, Trash2, BookOpen, Link as LinkIcon, GraduationCap } from 'lucide-react'
import { courseFormSchema, type CourseFormValues } from '@/lib/validation/courses'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

const levelOptions = [
  'Beginner',
  'Intermediate',
  'Advanced',
  'Beginner-Intermediate',
  'Intermediate-Advanced',
  'All Levels',
  'For All',
  'Junior–Senior',
]

export default function CreateCourseForm() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const form = useForm<CourseFormValues>({
    resolver: standardSchemaResolver(courseFormSchema),
    defaultValues: {
      title: '',
      level: '',
      blurb: '',
      href: '',
      image: '',
    },
  })

  const imageUrl = form.watch('image')
  const loading = form.formState.isSubmitting

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Invalid file type. Please select an image file (JPEG, PNG, WebP, or GIF).')
      return
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setUploadError('File size exceeds 5MB. Please select a smaller image.')
      return
    }

    setUploadError('')
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    setUploading(true)
    try {
      const uploadFormData = new FormData()
      uploadFormData.append('image', file)

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: uploadFormData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload image')
      }

      form.setValue('image', data.secure_url)
      setImagePreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err) {
      console.error('Error uploading image:', err)
      setUploadError(err instanceof Error ? err.message : 'Failed to upload image. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = () => {
    setImagePreview(null)
    form.setValue('image', '')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const onSubmit = async (values: CourseFormValues) => {
    setUploadError('')
    try {
      const href =
        values.href.trim() ||
        `/courses/${values.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`

      const result = await createCourse({
        ...values,
        href,
      })

      if (result.success) {
        form.reset({
          title: '',
          level: '',
          blurb: '',
          href: '',
          image: '',
        })
        setImagePreview(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        setIsOpen(false)
        router.refresh()
      } else {
        form.setError('root', { message: result.error || 'Failed to create course' })
      }
    } catch (err) {
      console.error('Error creating course:', err)
      form.setError('root', { message: 'An unexpected error occurred' })
    }
  }

  const handleDialogOpenChange = (open: boolean) => {
    if (loading || uploading) return
    setIsOpen(open)
    if (!open) {
      setImagePreview(null)
      setUploadError('')
      form.reset({ title: '', level: '', blurb: '', href: '', image: '' })
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const rootError = form.formState.errors.root?.message

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" className="bg-indigo-500 hover:bg-indigo-600 text-white shadow-md hover:shadow-lg">
          <Plus className="w-5 h-5" />
          Create Course
        </Button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-3xl! max-h-[95vh] p-0 gap-0 overflow-hidden flex flex-col"
      >
        <div className="bg-linear-to-r from-indigo-500 to-blue-600 px-4 sm:px-6 py-4 sm:py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg sm:text-xl font-bold text-white">Create New Course</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-indigo-100">
                Fill in the details below to create a course
              </DialogDescription>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => handleDialogOpenChange(false)}
            disabled={loading || uploading}
            className="text-white/80 hover:text-white hover:bg-white/10"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {(rootError || uploadError) && (
                <Alert variant="destructive">
                  <AlertDescription>{rootError || uploadError}</AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <BookOpen className="w-4 h-4 text-indigo-600" />
                      Course Title <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter course title"
                        disabled={loading}
                        className="border-2 border-gray-200 rounded-xl py-3 h-auto"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <GraduationCap className="w-4 h-4 text-indigo-600" />
                      Level <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <select
                        className="flex h-auto w-full rounded-xl border-2 border-gray-200 bg-transparent px-4 py-3 text-base shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                        disabled={loading}
                        {...field}
                      >
                        <option value="">Select a level</option>
                        {levelOptions.map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="blurb"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      Description <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder="Brief description of the course"
                        disabled={loading}
                        className="min-h-[100px] resize-none border-2 border-gray-200 rounded-xl py-3 md:text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="href"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <LinkIcon className="w-4 h-4 text-indigo-600" />
                      Course Link (Optional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="/courses/course-name (auto-generated if empty)"
                        disabled={loading}
                        className="border-2 border-gray-200 rounded-xl py-3 h-auto"
                        {...field}
                      />
                    </FormControl>
                    <p className="text-xs text-gray-500">Leave empty to auto-generate from title</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="image"
                render={() => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <ImageIcon className="w-4 h-4 text-indigo-600" />
                      Course Image <span className="text-red-500">*</span>
                    </FormLabel>
                    {imageUrl ? (
                      <div className="relative">
                        <div className="relative w-full h-64 rounded-xl overflow-hidden border-2 border-gray-200">
                          <Image src={imageUrl} alt="Course preview" fill className="object-cover" />
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          disabled={loading || uploading}
                          className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          disabled={loading || uploading}
                          className="hidden"
                          id="course-image-upload"
                        />
                        <label
                          htmlFor="course-image-upload"
                          className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                            uploading
                              ? 'border-indigo-400 bg-indigo-50'
                              : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
                          } ${loading || uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {uploading ? (
                            <div className="flex flex-col items-center gap-3">
                              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                              <p className="text-sm font-medium text-indigo-600">Uploading image...</p>
                            </div>
                          ) : (
                            <>
                              <Upload className="w-12 h-12 text-gray-400 mb-3" />
                              <p className="text-sm font-medium text-gray-600 mb-1">Click to upload or drag and drop</p>
                              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                            </>
                          )}
                        </label>
                        {imagePreview && (
                          <div className="mt-4 relative w-full h-48 rounded-xl overflow-hidden border-2 border-gray-200">
                            <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                          </div>
                        )}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDialogOpenChange(false)}
                  disabled={loading || uploading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || uploading || !imageUrl}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Create Course
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
