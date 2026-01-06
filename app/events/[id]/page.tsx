'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Clock, MapPin, ArrowLeft, CheckCircle } from 'lucide-react'
import { format, parse, isPast } from 'date-fns'
import { eventsData, type Event } from '../data'

// Booking Form Component
const BookingForm = ({ event }: { event: Event }) => {
  const [formData, setFormData] = useState({
    name: '',
    school: '',
    email: '',
    information: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.school.trim()) newErrors.school = 'School is required'
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }
    if (!formData.information.trim()) {
      newErrors.information = 'Basic information is required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      // Include event name in submission
      const submissionData = {
        ...formData,
        eventName: event.title,
        eventId: event.id,
      }
      
      // Log or send to API
      console.log('Booking submission:', submissionData)
      
      // Simulate form submission
      setIsSubmitted(true)
      setTimeout(() => {
        setIsSubmitted(false)
        setFormData({ name: '', school: '', email: '', information: '' })
        setErrors({})
      }, 3000)
    }
  }

  if (isSubmitted) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Booking Successful!
          </h3>
          <p className="text-gray-600 mb-2">
            Your booking request for <strong>{event.title}</strong> has been
            submitted.
          </p>
          <p className="text-sm text-gray-500">
            We&apos;ll contact you soon with confirmation details.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
      <h3 className="text-xl font-bold text-gray-900 mb-2">Book This Event</h3>
      <p className="text-sm text-gray-600 mb-6">{event.title}</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.name && (
            <p className="text-sm text-red-500 mt-1">{errors.name}</p>
          )}
        </div>
        <div>
          <label
            htmlFor="school"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            School <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="school"
            value={formData.school}
            onChange={(e) =>
              setFormData({ ...formData, school: e.target.value })
            }
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              errors.school ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.school && (
            <p className="text-sm text-red-500 mt-1">{errors.school}</p>
          )}
        </div>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.email && (
            <p className="text-sm text-red-500 mt-1">{errors.email}</p>
          )}
        </div>
        <div>
          <label
            htmlFor="information"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Basic Information <span className="text-red-500">*</span>
          </label>
          <textarea
            id="information"
            rows={4}
            value={formData.information}
            onChange={(e) =>
              setFormData({ ...formData, information: e.target.value })
            }
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              errors.information ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Tell us about your interest in this event..."
          />
          {errors.information && (
            <p className="text-sm text-red-500 mt-1">{errors.information}</p>
          )}
        </div>
        <button
          type="submit"
          className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
        >
          Book This Event
        </button>
      </form>
    </div>
  )
}

// Event Passed Component
const EventPassedMessage = ({ event }: { event: Event }) => {
  return (
    <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Event Has Passed
        </h3>
        <p className="text-gray-600 mb-4">
          This event has already taken place. Check out our upcoming events for
          new opportunities!
        </p>
        <Link
          href="/events"
          className="inline-block py-2 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
        >
          View Upcoming Events
        </Link>
      </div>
    </div>
  )
}

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = parseInt(params.id as string)
  const event = eventsData.find((e) => e.id === eventId)

  useEffect(() => {
    if (!event) {
      router.push('/events')
    }
  }, [event, router])

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Event Not Found
          </h1>
          <Link
            href="/events"
            className="inline-block py-2 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
          >
            Back to Events
          </Link>
        </div>
      </div>
    )
  }

  const eventDate = parse(event.date, 'yyyy-MM-dd', new Date())
  const hasPassed = isPast(eventDate) && eventDate.toDateString() !== new Date().toDateString()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <section className="relative bg-gradient-to-br from-indigo-900 via-blue-900 to-blue-600 text-white py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-blue-100 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Events</span>
          </Link>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-4">
            {event.title}
          </h1>
        </div>
      </section>

      {/* Main Content */}
      <main className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Event Details - Left Side */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
                {/* Event Info */}
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                    <span className="font-semibold">Date:</span>
                    <span>{format(eventDate, 'MMMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-5 h-5 text-indigo-600" />
                    <span className="font-semibold">Time:</span>
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-5 h-5 text-indigo-600" />
                    <span className="font-semibold">Venue:</span>
                    <span>{event.venue || event.location}</span>
                  </div>
                  {event.eligibility && (
                    <div className="pt-4 border-t border-gray-200">
                      <span className="font-semibold text-gray-900">
                        Eligibility:
                      </span>
                      <p className="text-gray-600 mt-1">{event.eligibility}</p>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 text-xl">
                    About This Event
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {event.fullDescription || event.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Booking Form / Event Passed - Right Side */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                {hasPassed ? (
                  <EventPassedMessage event={event} />
                ) : (
                  <BookingForm event={event} />
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

