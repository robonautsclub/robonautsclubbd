'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative overflow-hidden w-full min-w-full">
      <video
        className="absolute inset-0 w-full h-full object-cover object-center z-0"
        src="/re.mp4"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
      />
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-40 w-full">
        <div className="absolute top-0 right-0  h-96 bg-blue-200 w-full rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0  h-96 bg-indigo-200 w-full rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="relative w-full min-w-full px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-24 lg:py-28 xl:py-36">
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
          {/* Left Column - Content */}
          <div className="text-center ml-12 lg:text-left space-y-6 md:space-y-8 lg:space-y-10">
            {/* Main Tagline */}
            <div className="space-y-4 md:space-y-6">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight tracking-tight">
                <span className="block">Build Skills.</span>
                <span className="block">Break Barriers.</span>
                <span className="block text-transparent bg-clip-text bg-linear-to-r from-indigo-500 to-blue-500">
                  Go Global.
                </span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-xl mx-auto lg:mx-0 leading-relaxed px-4 sm:px-0">
                Empowering the next generation of robotics innovators through hands-on learning and global competition.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start pt-2 sm:pt-4">
              <Link
                href="/events"
                className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-indigo-500 text-white rounded-lg font-semibold hover:bg-indigo-600 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm sm:text-base"
              >
                Explore Events
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-white text-indigo-500 rounded-lg font-semibold border-2 border-indigo-100 hover:border-indigo-200 hover:bg-indigo-50 transition-colors text-sm sm:text-base"
              >
                Learn More
              </Link>
            </div>
          </div>

          {/* Right Column - Visual */}
          <div className="relative mt-8 lg:mt-0 hidden">
            <div className="relative aspect-square max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg mx-auto">
              {/* Main image container with linear border */}
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
