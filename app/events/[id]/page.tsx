'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, Clock, MapPin, ArrowLeft, CheckCircle, Users, Monitor, Building2 } from 'lucide-react'
import { format, parse, isPast } from 'date-fns'
import { eventsData, type Event } from '../data'

// Helper function to format 24-hour time to 12-hour format
const formatTime12 = (hour24: number, minute: number) => {
  const period = hour24 >= 12 ? 'PM' : 'AM'
  const hour12 = hour24 % 12 || 12
  return `${hour12}:${String(minute).padStart(2, '0')} ${period}`
}

// Helper function to generate agenda from event time
const generateAgenda = (event: Event) => {
  const timeMatch = event.time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
  if (!timeMatch) {
    return [
      { time: '09:30 AM - 10:30 AM', title: 'Opening & Welcome' },
      { time: '10:45 AM - 12:00 PM', title: 'Main Session' },
      { time: '12:00 PM - 1:00 PM', title: 'Break & Networking' },
      { time: '01:00 PM - 02:15 PM', title: 'Workshop & Activities' },
      { time: '02:30 PM - 04:00 PM', title: 'Hands-on Practice' },
      { time: '04:15 PM - 05:00 PM', title: 'Closing & Q&A' },
    ]
  }

  const startHour = parseInt(timeMatch[1])
  const startMin = parseInt(timeMatch[2])
  const isPM = timeMatch[3].toUpperCase() === 'PM'
  const start24 = isPM && startHour !== 12 ? startHour + 12 : startHour === 12 && !isPM ? 0 : startHour

  return [
    { time: `${formatTime12(start24, startMin)} - ${formatTime12((start24 + 1) % 24, startMin)}`, title: 'Opening & Welcome' },
    { time: `${formatTime12((start24 + 1) % 24, 15)} - ${formatTime12((start24 + 2) % 24, 30)}`, title: 'Main Session' },
    { time: `${formatTime12((start24 + 2) % 24, 30)} - ${formatTime12((start24 + 3) % 24, 0)}`, title: 'Break & Networking' },
    { time: `${formatTime12((start24 + 3) % 24, 0)} - ${formatTime12((start24 + 4) % 24, 15)}`, title: 'Workshop & Activities' },
    { time: `${formatTime12((start24 + 4) % 24, 30)} - ${formatTime12((start24 + 5) % 24, 0)}`, title: 'Hands-on Practice' },
    { time: `${formatTime12((start24 + 5) % 24, 15)} - ${formatTime12((start24 + 6) % 24, 0)}`, title: 'Closing & Q&A' },
  ]
}

// Helper function to extract tags from event
const getEventTags = (event: Event) => {
  const tags: string[] = []
  const titleLower = event.title.toLowerCase()
  const descLower = (event.fullDescription || event.description).toLowerCase()

  if (titleLower.includes('workshop') || descLower.includes('workshop')) tags.push('Workshop')
  if (titleLower.includes('competition') || titleLower.includes('olympiad') || titleLower.includes('robfest')) tags.push('Competition')
  if (titleLower.includes('bootcamp') || descLower.includes('bootcamp')) tags.push('Bootcamp')
  if (titleLower.includes('coding') || descLower.includes('programming') || descLower.includes('python')) tags.push('Programming')
  if (descLower.includes('robotics') || titleLower.includes('robot')) tags.push('Robotics')
  if (descLower.includes('stem') || descLower.includes('science')) tags.push('STEM')
  if (descLower.includes('ai') || descLower.includes('artificial intelligence')) tags.push('AI')
  if (descLower.includes('arduino') || descLower.includes('electronics')) tags.push('Electronics')

  // Default tags if none found
  if (tags.length === 0) {
    tags.push('Robotics', 'STEM', 'Education')
  }

  return tags.slice(0, 4) // Limit to 4 tags
}

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
      <div className="bg-white rounded-2xl p-8 border-2 border-green-200 shadow-lg">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Booking Successful!
          </h3>
          <p className="text-gray-600 mb-2">
            Your booking request for <strong className="text-indigo-600">{event.title}</strong> has been
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
    <div className="bg-white rounded-2xl p-7 border-2 border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Book Your Spot</h3>
        <p className="text-sm text-gray-500">{event.title}</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
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
            className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors ${
              errors.name ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'
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
            className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors ${
              errors.school ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'
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
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            placeholder="Enter your email"
            className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors ${
              errors.email ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'
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
            className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors resize-none ${
              errors.information ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'
            }`}
            placeholder="Tell us about your interest in this event..."
          />
          {errors.information && (
            <p className="text-sm text-red-500 mt-1">{errors.information}</p>
          )}
        </div>
        <button
          type="submit"
          className="w-full py-3.5 px-6 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
        >
          Submit
        </button>
      </form>
    </div>
  )
}

// Event Passed Component
const EventPassedMessage = () => {
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
          className="inline-block py-2 px-6 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-lg transition-colors"
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
            className="inline-block py-2 px-6 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-lg transition-colors"
          >
            Back to Events
          </Link>
        </div>
      </div>
    )
  }

  const eventDate = parse(event.date, 'yyyy-MM-dd', new Date())
  const hasPassed = isPast(eventDate) && eventDate.toDateString() !== new Date().toDateString()
  const agenda = generateAgenda(event)
  const tags = getEventTags(event)
  const isOnline = event.location.toLowerCase().includes('online') || event.venue?.toLowerCase().includes('online')

  return (
    <div className="min-h-screen bg-linear-to-br from-sky-50 via-blue-50 to-indigo-50">
      {/* Compact Header Section */}
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 right-0 h-96 bg-blue-200 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 h-96 bg-indigo-200 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-12 md:py-16">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-gray-700 hover:text-indigo-600 mb-6 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Events</span>
          </Link>
          
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 items-start">
            {/* Left Column - Title and Subtitle */}
            <div className="lg:col-span-2">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-4 leading-tight">
                {event.title}
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed max-w-3xl">
                {event.description}
              </p>
            </div>

            {/* Right Column - Booking Form */}
            <div className="lg:col-span-1 order-first lg:order-last">
              <div className="sticky top-24">
                {hasPassed ? (
                  <EventPassedMessage />
                ) : (
                  <BookingForm event={event} />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 pb-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Image and Content Sections */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Event Image */}
            <div className="bg-white rounded-2xl overflow-hidden border-2 border-gray-200 shadow-lg">
              <div className="relative h-64 md:h-80 lg:h-96">
                <Image
                  src={event.image || '/robotics-event.jpg'}
                  alt={event.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>

            {/* Overview Section */}
            <div className="bg-white rounded-2xl p-6 md:p-8 border-2 border-gray-200 shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Overview</h3>
              <p className="text-gray-700 leading-relaxed text-base md:text-lg">
                {event.fullDescription || event.description}
              </p>
            </div>

            {/* Event Details Section */}
            <div className="bg-white rounded-2xl p-6 md:p-8 border-2 border-gray-200 shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Event Details</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-50/50 border border-indigo-100">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Date</p>
                    <p className="font-semibold text-gray-900">{format(eventDate, 'MMMM d, yyyy')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Time</p>
                    <p className="font-semibold text-gray-900">{event.time}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-purple-50/50 border border-purple-100">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500 mb-1">Venue</p>
                    <p className="font-semibold text-gray-900">{event.venue || event.location}</p>
                  </div>
                </div>
                {isOnline ? (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-cyan-50/50 border border-cyan-100">
                    <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center shrink-0">
                      <Monitor className="w-5 h-5 text-cyan-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-500 mb-1">Mode</p>
                      <p className="font-semibold text-gray-900">Online Streaming</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-purple-50/50 border border-purple-100">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-purple-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-500 mb-1">Mode</p>
                      <p className="font-semibold text-gray-900">In-person</p>
                    </div>
                  </div>
                )}
                {event.eligibility && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-green-50/50 border border-green-100">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-500 mb-1">Audience</p>
                      <p className="font-semibold text-gray-900">{event.eligibility}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Agenda Section */}
            <div className="bg-white rounded-2xl p-6 md:p-8 border-2 border-gray-200 shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Agenda</h3>
              <ul className="space-y-3">
                {agenda.map((item, index) => (
                  <li key={index} className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
                    <span className="text-indigo-600 font-semibold shrink-0 sm:min-w-[140px]">{item.time}</span>
                    <span className="text-gray-700 hidden sm:inline">|</span>
                    <span className="text-gray-700">{item.title}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* About the Organizer Section */}
            <div className="bg-white rounded-2xl p-6 md:p-8 border-2 border-gray-200 shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">About the Organizer</h3>
              <div className="space-y-4 text-gray-700 leading-relaxed text-base md:text-lg">
                <p>
                  Robonauts Club is Bangladesh&apos;s first youth robotics club, dedicated to preparing students for RoboFest and global STEM challenges. We empower the next generation of robotics innovators through hands-on learning, expert mentorship, and competitive opportunities.
                </p>
                <p>
                  Our events bring together passionate students, experienced mentors, and industry leaders to share knowledge, tools, and inspiration that shape the future of robotics and technology in Bangladesh.
                </p>
              </div>
            </div>

            {/* Tags Section */}
            <div className="bg-white rounded-2xl p-6 md:p-8 border-2 border-gray-200 shadow-lg">
              <div className="flex flex-wrap gap-3">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium border border-indigo-200 hover:bg-indigo-100 transition-colors"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Empty space for form (already positioned above) */}
          <div className="lg:col-span-1"></div>
        </div>
      </main>
    </div>
  )
}

