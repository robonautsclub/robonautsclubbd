'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createEvent } from '../actions'
import { Plus, X, Calendar, Clock, MapPin, FileText, Users, Image as ImageIcon, Sparkles } from 'lucide-react'
import DatePicker from './DatePicker'
import TimePicker from './TimePicker'

export default function CreateEventForm() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    description: '',
    time: '',
    location: '',
    venue: '',
    fullDescription: '',
    eligibility: '',
    agenda: '',
    image: '',
  })

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
      const result = await createEvent(formData)

      if (result.success) {
        // Reset form and close modal
        setFormData({
          title: '',
          date: '',
          description: '',
          time: '',
          location: '',
          venue: '',
          fullDescription: '',
          eligibility: '',
          agenda: '',
          image: '',
        })
        setIsOpen(false)
        router.refresh()
      } else {
        setError(result.error || 'Failed to create event')
      }
    } catch (err) {
      console.error('Error creating event:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
      >
        <Plus className="w-5 h-5" />
        Create Event
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[95vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-blue-600 px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Create New Event</h3>
              <p className="text-sm text-indigo-100">Fill in the details below to create an event</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-r-lg">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                    <X className="w-3 h-3 text-white" />
                  </div>
                  <p className="text-sm font-medium">{error}</p>
                </div>
              </div>
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
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                  Date <span className="text-red-500">*</span>
                </label>
                <DatePicker
                  value={formData.date}
                  onChange={(value) => setFormData({ ...formData, date: value })}
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  Time
                </label>
                <TimePicker
                  value={formData.time}
                  onChange={(value) => setFormData({ ...formData, time: value })}
                  disabled={loading}
                />
              </div>
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
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })}
                placeholder="e.g., Ages 10-18, Students in grades 3-12"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                disabled={loading}
              />
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
                onChange={(e) => setFormData({ ...formData, agenda: e.target.value })}
                placeholder="Event schedule and timeline (one per line)"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all resize-none font-mono text-sm"
                disabled={loading}
              />
              <p className="text-xs text-gray-500">Tip: Use line breaks to separate agenda items</p>
            </div>

            {/* Image URL */}
            <div className="space-y-2">
              <label htmlFor="image" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                Image URL
              </label>
              <input
                id="image"
                type="text"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="/robotics-event.jpg or https://..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                disabled={loading}
              />
              <p className="text-xs text-gray-500">Enter a relative path (e.g., /image.jpg) or full URL</p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  setError('')
                }}
                disabled={loading}
                className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
