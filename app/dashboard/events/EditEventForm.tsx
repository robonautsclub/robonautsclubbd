'use client'

import { useState, FormEvent, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { updateEvent } from '../actions'
import { X, Calendar, Clock, MapPin, FileText, Users, Image as ImageIcon, Sparkles, Edit, Tag } from 'lucide-react'
import DatePicker from './DatePicker'
import TimePicker from './TimePicker'
import type { Event } from '@/types/event'

interface EditEventFormProps {
  event: Event
  onClose: () => void
}

export default function EditEventForm({ event, onClose }: EditEventFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  // Helper function to format date for input
  const formatDateForInput = (date: Date | string | undefined): string => {
    if (!date) return ''
    if (date instanceof Date) {
      return date.toISOString().split('T')[0]
    }
    // Handle ISO string or date string
    const dateStr = typeof date === 'string' ? date : String(date)
    // If it contains 'T', split it; otherwise use as is
    return dateStr.includes('T') ? dateStr.split('T')[0] : dateStr
  }

  const [formData, setFormData] = useState({
    title: event.title || '',
    date: formatDateForInput(event.date),
    description: event.description || '',
    time: event.time || '',
    location: event.location || '',
    venue: event.venue || '',
    fullDescription: event.fullDescription || '',
    eligibility: event.eligibility || '',
    agenda: event.agenda || '',
    image: event.image || '',
    tags: event.tags || [],
  })
  const [tagInput, setTagInput] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Basic validation
    if (!formData.title.trim() || !formData.date || !formData.description.trim()) {
      setError('Please fill in all required fields (Name, Date, Description)')
      setLoading(false)
      return
    }

    try {
      const result = await updateEvent(event.id, formData)

      if (result.success) {
        onClose()
        router.refresh()
      } else {
        setError(result.error || 'Failed to update event')
      }
    } catch (err) {
      console.error('Error updating event:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[95vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-linear-to-r from-indigo-500 to-blue-600 px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Edit className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Edit Event</h3>
              <p className="text-sm text-indigo-100">Update the event details below</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <span className="font-semibold">Error:</span>
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="edit-title" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              Event Name <span className="text-red-500">*</span>
            </label>
            <input
              id="edit-title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-date" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Calendar className="w-4 h-4 text-indigo-500" />
                Date <span className="text-red-500">*</span>
              </label>
              <DatePicker
                value={formData.date}
                onChange={(date) => setFormData({ ...formData, date })}
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="edit-time" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Clock className="w-4 h-4 text-indigo-500" />
                Time
              </label>
              <TimePicker
                value={formData.time}
                onChange={(time) => setFormData({ ...formData, time })}
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label htmlFor="edit-description" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="edit-description"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 resize-none transition-all"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="edit-fullDescription" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              Full Description
            </label>
            <textarea
              id="edit-fullDescription"
              rows={4}
              value={formData.fullDescription}
              onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 resize-none transition-all"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-location" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <MapPin className="w-4 h-4 text-indigo-500" />
                Location
              </label>
              <input
                id="edit-location"
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="edit-venue" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <MapPin className="w-4 h-4 text-indigo-500" />
                Venue
              </label>
              <input
                id="edit-venue"
                type="text"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label htmlFor="edit-eligibility" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Users className="w-4 h-4 text-indigo-500" />
              Eligibility
            </label>
            <input
              id="edit-eligibility"
              type="text"
              value={formData.eligibility}
              onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })}
              placeholder="e.g., Ages 10-18"
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="edit-agenda" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              Agenda
            </label>
            <textarea
              id="edit-agenda"
              rows={4}
              value={formData.agenda}
              onChange={(e) => setFormData({ ...formData, agenda: e.target.value })}
              placeholder="Event schedule and timeline"
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 resize-none transition-all"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">Enter each agenda item on a new line</p>
          </div>

          <div>
            <label htmlFor="edit-tags" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Tag className="w-4 h-4 text-indigo-500" />
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
                      onClick={() => {
                        const newTags = formData.tags.filter((_, i) => i !== index)
                        setFormData({ ...formData, tags: newTags })
                      }}
                      disabled={loading}
                      className="hover:bg-indigo-200 rounded-full p-0.5 transition-colors disabled:opacity-50"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  id="edit-tags"
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
                      e.preventDefault()
                      const trimmedTag = tagInput.trim().replace(/,$/, '')
                      if (trimmedTag && !formData.tags.includes(trimmedTag)) {
                        setFormData({ ...formData, tags: [...formData.tags, trimmedTag] })
                        setTagInput('')
                      }
                    }
                  }}
                  placeholder={formData.tags.length === 0 ? "Type a tag and press Enter..." : "Add another tag..."}
                  className="flex-1 min-w-[150px] outline-none text-sm bg-transparent"
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-gray-500">Press Enter or comma to add a tag. Tags help categorize your event.</p>
            </div>
          </div>

          <div>
            <label htmlFor="edit-image" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <ImageIcon className="w-4 h-4 text-indigo-500" />
              Image URL
            </label>
            <input
              id="edit-image"
              type="text"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              placeholder="/robotics-event.jpg"
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">Enter a relative path (e.g., /image.jpg) or full URL</p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t-2 border-gray-200 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Updating...
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4" />
                  Update Event
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

