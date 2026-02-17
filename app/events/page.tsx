import React from 'react'
import { Metadata } from 'next'
import { SITE_CONFIG } from '@/lib/site-config'
import {
  Calendar,
  Sparkles,
  Users,
  ArrowRight,
} from 'lucide-react'
import { getPublicEvents } from './actions'
import RealtimeEventsList from '@/components/RealtimeEventsList'
import { isEventUpcoming } from '@/lib/dateUtils'

export const metadata: Metadata = {
  title: "Events",
  description: "Discover upcoming robotics workshops, competitions, bootcamps, and STEM events in Bangladesh. Join hands-on training sessions, participate in Robofest, and connect with 500+ robotics enthusiasts.",
  keywords: [
    "robotics events Bangladesh",
    "STEM workshops",
    "robotics competitions",
    "Robofest",
    "robotics bootcamp",
    "STEM training events",
    "robotics workshop Dhaka",
  ],
  openGraph: {
    title: `Robotics Events | ${SITE_CONFIG.name}`,
    description: "Discover upcoming robotics workshops, competitions, bootcamps, and STEM events in Bangladesh.",
    url: "/events",
    images: [
      {
        url: "/robotics-event.jpg",
        width: 1200,
        height: 630,
        alt: `${SITE_CONFIG.name} Events`,
      },
    ],
  },
  alternates: {
    canonical: "/events",
  },
};

// ISR: Revalidate every 60 seconds to keep content fresh
// Pages are statically generated and updated on-demand when events change
export const revalidate = 60

// --- Main Page ---
export default async function EventsPage() {
  // Fetch initial events from Firestore for SSR
  const initialEvents = await getPublicEvents()

  // Calculate initial stats for hero section
  const initialUpcoming = initialEvents.filter((event) => {
    return isEventUpcoming(event.date)
  })

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Hero Header */}
      <section
        className="relative text-white py-16 sm:py-20 md:py-24 px-4 sm:px-6 overflow-hidden"
        style={{
          backgroundImage: "url('/robobanner.gif')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-300 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-300 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/10 backdrop-blur-sm mb-4 sm:mb-6">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm font-medium">
                {initialUpcoming.length} Upcoming Events
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 sm:mb-6 tracking-tight px-2">
              Events & Workshops
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed px-2">
              Join us for exciting robotics competitions, hands-on STEM
              workshops, and educational bootcamps designed to inspire the next
              generation of innovators.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-12 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20">
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-200" />
                <span className="text-2xl sm:text-3xl font-bold">{initialUpcoming.length}</span>
              </div>
              <p className="text-blue-100 text-xs sm:text-sm">Upcoming Events</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20">
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-200" />
                <span className="text-2xl sm:text-3xl font-bold">{initialEvents.length}</span>
              </div>
              <p className="text-blue-100 text-xs sm:text-sm">Total Events</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20">
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-blue-200" />
                <span className="text-2xl sm:text-3xl font-bold">{initialEvents.length - initialUpcoming.length}</span>
              </div>
              <p className="text-blue-100 text-xs sm:text-sm">Past Events</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Real-time Events List - Automatically updates when database changes */}
          <RealtimeEventsList initialEvents={initialEvents} />

          {/* Call to action */}
          <div className="mt-12 sm:mt-16 md:mt-20 bg-linear-to-br from-indigo-400 to-blue-500 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center text-white">
            <Sparkles className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-indigo-200" />
            <h3 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 px-2">
              Want to Organize an Event?
            </h3>
            <p className="text-base sm:text-lg text-indigo-100 mb-4 sm:mb-6 max-w-2xl mx-auto px-2">
              We&apos;re always open to collaborating with schools and
              communities to bring robotics education to more students.
            </p>
            <a
              href={`mailto:${SITE_CONFIG.email}`}
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-white text-indigo-500 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg text-sm sm:text-base"
            >
              Contact Us
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}
