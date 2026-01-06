'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-linear-to-br from-sky-50 via-blue-50 to-indigo-50 w-full min-w-full">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-40 w-full">
        <div className="absolute top-0 right-0  h-96 bg-blue-200 w-full rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0  h-96 bg-indigo-200 w-full rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="ml-10 relative w-full min-w-full px-4 sm:px-6 lg:px-8 py-24 sm:py-28 lg:py-36">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Column - Content */}
          <div className="text-center lg:text-left space-y-10">
            {/* Main Tagline */}
            <div className="space-y-6">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight tracking-tight">
                <span className="block">Build Skills.</span>
                <span className="block">Break Barriers.</span>
                <span className="block text-transparent bg-clip-text bg-linear-to-r from-indigo-600 to-blue-600">
                  Go Global.
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Empowering the next generation of robotics innovators through hands-on learning and global competition.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
              <Link
                href="/events"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Explore Events
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-indigo-600 rounded-lg font-semibold border-2 border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
              >
                Learn More
              </Link>
            </div>
          </div>

          {/* Right Column - Visual */}
          <div className="relative">
            <div className="relative aspect-square max-w-lg mx-auto">
              {/* Main image container with gradient border */}
              <div className="absolute inset-0 bg-linear-to-br from-indigo-400 to-blue-500 rounded-3xl transform rotate-6 opacity-20 blur-xl" />
              <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-100">
                <div className="aspect-square relative rounded-3xl overflow-hidden bg-linear-to-br from-sky-100 to-indigo-100">
                  <Image
                    src="/robot.gif"
                    alt="Robonauts Club Logo"
                    fill
                    className="object-contain rounded-3xl"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom wave decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-linear-to-t from-white to-transparent" />
    </section>
  )
}
