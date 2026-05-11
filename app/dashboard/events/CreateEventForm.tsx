'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useWatch } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import Image from 'next/image'
import { createEvent } from '../actions'
import { Plus, X, Calendar, Clock, MapPin, FileText, Users, Image as ImageIcon, Sparkles, Upload, Trash2, Tag, Banknote } from 'lucide-react'
import MultiDatePicker from './MultiDatePicker'
import TimePicker from './TimePicker'
import CustomFormBuilder from './CustomFormBuilder'
import type { Event, EventDefaultRegistrationFields } from '@/types/event'
import { dashboardEventFormSchema, type DashboardEventFormValues } from '@/lib/validation/events'
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

const createEventFormDefaults: DashboardEventFormValues = {
  title: '',
  dates: [],
  description: '',
  time: '9:00 AM - 5:00 PM',
  location: '',
  venue: '',
  fullDescription: '',
  eligibility: '',
  agenda: '',
  image: '',
  tags: [],
  isPaid: false,
  amount: '',
  paymentBkashNumber: '',
  categories: [],
  registrationClosingDate: '',
  registrationDisabled: false,
  contactPersonName: '',
  contactPersonDesignation: '',
  contactPersonMobileOrEmail: '',
  customFormFields: [],
  defaultRegistrationFields: {
    name: { enabled: true, required: true },
    email: { enabled: true, required: true },
    phone: { enabled: true, required: true },
    school: { enabled: true, required: true },
    category: { enabled: true, required: false },
    information: { enabled: true, required: false },
  } as EventDefaultRegistrationFields,
}

export default function CreateEventForm() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [tagInput, setTagInput] = useState('')

  const form = useForm<DashboardEventFormValues>({
    resolver: standardSchemaResolver(dashboardEventFormSchema),
    defaultValues: createEventFormDefaults,
  })

  const formData = useWatch({ control: form.control }) as DashboardEventFormValues
  const loading = form.formState.isSubmitting

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please select an image file (JPEG, PNG, WebP, or GIF).')
      return
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setError('File size exceeds 5MB. Please select a smaller image.')
      return
    }

    setError('')

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Automatically upload the image
    await uploadImageFile(file)
  }

  const uploadImageFile = async (file: File) => {
    setUploading(true)
    setError('')

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
      setError(err instanceof Error ? err.message : 'Failed to upload image. Please try again.')
      // Keep the preview so user can retry
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

  const handleAddTag = (tag: string) => {
    const trimmedTag = tag.trim()
    const tags = form.getValues('tags')
    if (trimmedTag && !tags.includes(trimmedTag)) {
      form.setValue('tags', [...tags, trimmedTag])
      setTagInput('')
    }
  }

  const handleRemoveTag = (index: number) => {
    const tags = form.getValues('tags')
    form.setValue(
      'tags',
      tags.filter((_, i) => i !== index),
    )
  }

  const onSubmit = async (values: DashboardEventFormValues) => {
    setError('')
    const validCategories = values.categories
      .map((category) => ({
        name: category.name.trim(),
        amount:
          category.amount === '' || category.amount == null || Number.isNaN(Number(category.amount))
            ? undefined
            : Number(category.amount),
      }))
      .filter((category) => category.name.length > 0)

    const eventTime = values.time || '9:00 AM - 5:00 PM'
    const dateValue = values.dates.length === 1 ? values.dates[0] : values.dates.join(',')

    try {
      const { dates, registrationDisabled, ...restValues } = values
      void dates
      void registrationDisabled
      const result = await createEvent({
        ...restValues,
        date: dateValue,
        time: eventTime,
        isPaid: values.isPaid,
        amount: values.isPaid && values.amount !== '' ? Number(values.amount) : undefined,
        paymentBkashNumber: undefined,
        categories: validCategories.map((category) => ({
          name: category.name,
          amount: values.isPaid ? category.amount : undefined,
        })),
        registrationClosingDate: values.registrationClosingDate?.trim() || undefined,
        contactPersonName: values.contactPersonName.trim(),
        contactPersonDesignation: values.contactPersonDesignation.trim(),
        contactPersonMobileOrEmail: values.contactPersonMobileOrEmail.trim(),
        customFormFields: values.customFormFields,
        defaultRegistrationFields: values.defaultRegistrationFields as Event['defaultRegistrationFields'],
      })

      if (result.success) {
        form.reset(createEventFormDefaults)
        setTagInput('')
        setImagePreview(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        setIsOpen(false)
        router.refresh()
      } else {
        setError(result.error || 'Failed to create event')
      }
    } catch (err) {
      console.error('Error creating event:', err)
      setError('An unexpected error occurred')
    }
  }

  const handleSheetOpenChange = (open: boolean) => {
    if (loading || uploading) return
    setIsOpen(open)
    if (!open) {
      setError('')
      setImagePreview(null)
      setTagInput('')
      form.reset(createEventFormDefaults)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleSheetOpenChange}>
      <SheetTrigger asChild>
        <Button
          type="button"
          className="bg-indigo-500 hover:bg-indigo-600 text-white shadow-md hover:shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Create Event
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full sm:max-w-3xl! p-0 gap-0 flex flex-col"
      >
        {/* Header */}
        <div className="bg-linear-to-r from-indigo-500 to-blue-600 px-4 sm:px-6 py-4 sm:py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <SheetTitle className="text-lg sm:text-xl font-bold text-white">Create New Event</SheetTitle>
              <SheetDescription className="text-xs sm:text-sm text-indigo-100">Fill in the details below to create an event</SheetDescription>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => handleSheetOpenChange(false)}
            disabled={loading || uploading}
            className="text-white/80 hover:text-white hover:bg-white/10"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Event Name */}
            <div className="space-y-2">
              <label htmlFor="title" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Event Name <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => form.setValue('title', e.target.value)}
                required
                placeholder="Enter event name"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                disabled={loading}
              />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  Date(s) <span className="text-red-500">*</span>
                </label>
                <MultiDatePicker
                  value={formData.dates}
                  onChange={(dates) => form.setValue('dates', dates)}
                  disabled={loading || uploading}
                  required
                />
                <p className="text-xs text-gray-500">Select one or multiple dates for the event</p>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  Time
                </label>
                <TimePicker
                  value={formData.time}
                  onChange={(value) => form.setValue('time', value)}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Registration closes on (optional) */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Calendar className="w-4 h-4 text-indigo-600" />
                Registration closes on
              </label>
              <MultiDatePicker
                value={formData.registrationClosingDate ? [formData.registrationClosingDate] : []}
                onChange={(dates) =>
                  form.setValue(
                    'registrationClosingDate',
                    dates.length === 0 ? '' : dates[dates.length - 1] ?? '',
                  )
                }
                disabled={loading || uploading}
              />
              <p className="text-xs text-gray-500">Optional. Select one date to close registration; leave empty to keep registration open until the event date.</p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="description" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <FileText className="w-4 h-4 text-indigo-600" />
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => form.setValue('description', e.target.value)}
                required
                placeholder="Brief description of the event"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all resize-none"
                disabled={loading}
              />
            </div>

            {/* Full Description */}
            <div className="space-y-2">
              <label htmlFor="fullDescription" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <FileText className="w-4 h-4 text-indigo-600" />
                Full Description
              </label>
              <textarea
                id="fullDescription"
                rows={4}
                value={formData.fullDescription}
                onChange={(e) => form.setValue('fullDescription', e.target.value)}
                placeholder="Detailed description of the event"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all resize-none"
                disabled={loading}
              />
            </div>

            {/* Location and Venue */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="location" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <MapPin className="w-4 h-4 text-indigo-600" />
                  Location
                </label>
                <input
                  id="location"
                  type="text"
                  value={formData.location}
                  onChange={(e) => form.setValue('location', e.target.value)}
                  placeholder="Event location"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="venue" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <MapPin className="w-4 h-4 text-indigo-600" />
                  Venue
                </label>
                <input
                  id="venue"
                  type="text"
                  value={formData.venue}
                  onChange={(e) => form.setValue('venue', e.target.value)}
                  placeholder="Specific venue name"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Eligibility */}
            <div className="space-y-2">
              <label htmlFor="eligibility" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Users className="w-4 h-4 text-indigo-600" />
                Eligibility
              </label>
              <input
                id="eligibility"
                type="text"
                value={formData.eligibility}
                onChange={(e) => form.setValue('eligibility', e.target.value)}
                placeholder="e.g., Ages 10-18, Students in grades 3-12"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                disabled={loading}
              />
            </div>

            {/* Categories */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Tag className="w-4 h-4 text-indigo-600" />
                Event Categories (optional)
              </label>
              <div className="space-y-2">
                {formData.categories.map((category, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <input
                      type="text"
                      value={category.name}
                      onChange={(e) => {
                        const categories = [...form.getValues('categories')]
                        categories[index] = { ...categories[index], name: e.target.value }
                        form.setValue('categories', categories)
                      }}
                      placeholder="Category name (e.g. Junior, Senior)"
                      disabled={loading}
                      className="md:col-span-3 w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        form.setValue(
                          'categories',
                          form.getValues('categories').filter((_, i) => i !== index),
                        )
                      }}
                      disabled={loading}
                      className="md:col-span-1 px-3 py-2.5 border-2 border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-all"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    form.setValue('categories', [...form.getValues('categories'), { name: '', amount: '' }])
                  }
                  disabled={loading}
                  className="px-4 py-2.5 border-2 border-indigo-200 text-indigo-700 rounded-xl hover:bg-indigo-50 transition-all text-sm font-medium"
                >
                  + Add Category
                </button>
                <p className="text-xs text-gray-500">
                  Add category names first. If paid is enabled, amount inputs will appear for each category.
                </p>
              </div>
            </div>

            {/* Paid event */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Banknote className="w-4 h-4 text-indigo-600" />
                Paid event
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPaid}
                  onChange={(e) => {
                    const checked = e.target.checked
                    const cur = form.getValues()
                    form.setValue('isPaid', checked)
                    form.setValue('amount', checked ? cur.amount : '')
                    form.setValue('paymentBkashNumber', '')
                    form.setValue(
                      'categories',
                      cur.categories.map((category) => ({
                        ...category,
                        amount: checked ? category.amount : '',
                      })),
                    )
                  }}
                  disabled={loading}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">This is a paid event</span>
              </label>
              {formData.isPaid && (
                <div className="mt-2 space-y-3">
                  {formData.categories.filter((category) => category.name.trim()).length > 0 ? (
                    <div className="space-y-2">
                      {formData.categories.map((category, index) => {
                        if (!category.name.trim()) return null
                        return (
                          <div key={`category-amount-${index}`}>
                            <label className="block text-sm font-medium text-gray-600 mb-1">
                              {category.name.trim()} Amount (BDT) <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              min={1}
                              value={category.amount === '' ? '' : category.amount}
                              onChange={(e) => {
                                const categories = [...form.getValues('categories')]
                                categories[index] = {
                                  ...categories[index],
                                  amount: e.target.value === '' ? '' : Number(e.target.value),
                                }
                                form.setValue('categories', categories)
                              }}
                              placeholder={`Amount for ${category.name.trim()}`}
                              disabled={loading}
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                            />
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div>
                      <label htmlFor="amount" className="block text-sm font-medium text-gray-600 mb-1">
                        Base Amount (BDT) <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="amount"
                        type="number"
                        min={1}
                        value={formData.amount === '' ? '' : formData.amount}
                        onChange={(e) =>
                          form.setValue('amount', e.target.value === '' ? '' : Number(e.target.value))
                        }
                        placeholder="e.g. 500"
                        disabled={loading}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                      />
                    </div>
                  )}
                  <p className="text-xs text-indigo-600">
                    Category amount overrides base amount during checkout when categories exist.
                  </p>
                </div>
              )}
            </div>

            {/* Agenda */}
            <div className="space-y-2">
              <label htmlFor="agenda" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Clock className="w-4 h-4 text-indigo-600" />
                Agenda
              </label>
              <textarea
                id="agenda"
                rows={4}
                value={formData.agenda}
                onChange={(e) => form.setValue('agenda', e.target.value)}
                placeholder="Event schedule and timeline (one per line)"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all resize-none font-mono text-sm"
                disabled={loading}
              />
              <p className="text-xs text-gray-500">Tip: Use line breaks to separate agenda items</p>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label htmlFor="tags" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Tag className="w-4 h-4 text-indigo-600" />
                Tags
              </label>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2 p-3 min-h-12 border-2 border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-indigo-400 focus-within:border-indigo-400 transition-all bg-white">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(index)}
                        disabled={loading || uploading}
                        className="hover:bg-indigo-200 rounded-full p-0.5 transition-colors disabled:opacity-50"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    id="tags"
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
                        e.preventDefault()
                        handleAddTag(tagInput)
                      }
                    }}
                    placeholder={formData.tags.length === 0 ? "Type a tag and press Enter..." : "Add another tag..."}
                    className="flex-1 min-w-[150px] outline-none text-sm bg-transparent"
                    disabled={loading || uploading}
                  />
                </div>
                <p className="text-xs text-gray-500">Press Enter or comma to add a tag. Tags help categorize your event.</p>
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                Event Image
              </label>
              
              {formData.image ? (
                <div className="space-y-2">
                  <div className="relative w-full h-48 rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-50">
                    <Image
                      src={formData.image}
                      alt="Event preview"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      disabled={loading || uploading}
                      className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-green-600">✓ Image uploaded successfully</p>
                </div>
              ) : imagePreview ? (
                <div className="space-y-2">
                  <div className="relative w-full h-48 rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-50">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    {uploading && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2 text-white">
                          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <p className="text-sm font-medium">Uploading...</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {!uploading && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      disabled={loading}
                      className="w-full px-4 py-2.5 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Remove Image
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    id="image"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={loading || uploading}
                  />
                  <label
                    htmlFor="image"
                    className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                      loading || uploading
                        ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                        : 'border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50'
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold text-indigo-600">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, WebP, or GIF (MAX. 5MB)</p>
                    </div>
                  </label>
                </div>
              )}
              <div className="space-y-1">
                <p className="text-xs text-gray-500">
                  Upload an image from your device. It will be automatically optimized and converted to AVIF format.
                </p>
                <p className="text-xs text-indigo-600 font-medium">
                  Recommended size: 1200 × 800 pixels (3:2 aspect ratio) for best display quality
                </p>
              </div>
            </div>

            {/* Contact person */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Users className="w-4 h-4 text-indigo-600" />
                Contact Person (optional)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={formData.contactPersonName}
                  onChange={(e) => form.setValue('contactPersonName', e.target.value)}
                  placeholder="Contact person name"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                  disabled={loading}
                />
                <input
                  type="text"
                  value={formData.contactPersonDesignation}
                  onChange={(e) => form.setValue('contactPersonDesignation', e.target.value)}
                  placeholder="Designation"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                  disabled={loading}
                />
              </div>
              <input
                type="text"
                value={formData.contactPersonMobileOrEmail}
                onChange={(e) => form.setValue('contactPersonMobileOrEmail', e.target.value)}
                placeholder="Mobile number or email"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <div className="space-y-3 border-2 border-gray-200 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-gray-700">Default Registration Fields</h4>
                <p className="text-xs text-gray-500">Name, email, and phone are always required.</p>

                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
                    <span>Name</span>
                    <span className="text-xs font-medium text-gray-500">Always required</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
                    <span>Email</span>
                    <span className="text-xs font-medium text-gray-500">Always required</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
                    <span>Phone</span>
                    <span className="text-xs font-medium text-gray-500">Always required</span>
                  </div>

                  {(['school', 'category', 'information'] as const).map((fieldKey) => (
                    <div key={fieldKey} className="rounded-lg border border-gray-200 px-3 py-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="capitalize">{fieldKey === 'information' ? 'Other Information' : fieldKey}</span>
                        <label className="inline-flex items-center gap-2 text-xs text-gray-600">
                          <input
                            type="checkbox"
                            checked={formData.defaultRegistrationFields[fieldKey].enabled}
                            onChange={(e) => {
                              const drf = form.getValues('defaultRegistrationFields')
                              form.setValue('defaultRegistrationFields', {
                                ...drf,
                                [fieldKey]: {
                                  ...drf[fieldKey],
                                  enabled: e.target.checked,
                                  required: e.target.checked ? drf[fieldKey].required : false,
                                },
                              } as EventDefaultRegistrationFields)
                            }}
                            disabled={
                              loading ||
                              uploading ||
                              (fieldKey === 'category' && formData.categories.some((category) => category.name.trim().length > 0))
                            }
                          />
                          Enabled
                        </label>
                      </div>
                      {fieldKey === 'category' && formData.categories.some((category) => category.name.trim().length > 0) && (
                        <p className="mt-1 text-xs text-gray-500">Category stays enabled when event categories are configured.</p>
                      )}
                      <label className="mt-2 inline-flex items-center gap-2 text-xs text-gray-600">
                        <input
                          type="checkbox"
                          checked={formData.defaultRegistrationFields[fieldKey].required}
                          onChange={(e) => {
                            const drf = form.getValues('defaultRegistrationFields')
                            form.setValue('defaultRegistrationFields', {
                              ...drf,
                              [fieldKey]: {
                                ...drf[fieldKey],
                                required: e.target.checked,
                              },
                            } as EventDefaultRegistrationFields)
                          }}
                          disabled={loading || uploading || !formData.defaultRegistrationFields[fieldKey].enabled}
                        />
                        Required
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <CustomFormBuilder
                fields={formData.customFormFields}
                onChange={(customFormFields) => form.setValue('customFormFields', customFormFields)}
                disabled={loading || uploading}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSheetOpenChange(false)}
                disabled={loading || uploading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-indigo-500 hover:bg-indigo-600 text-white shadow-md hover:shadow-lg"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Create Event
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  )
}
