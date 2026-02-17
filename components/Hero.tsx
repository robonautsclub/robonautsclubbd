'use client'

import { useState } from 'react'
import { SITE_CONFIG } from '@/lib/site-config'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Volume2, VolumeX } from 'lucide-react'

export default function Hero() {
  const [muted, setMuted] = useState(true)

  return (
    <section className="relative overflow-hidden w-full min-w-full min-h-screen">
      <video
        className="absolute inset-0 w-full h-full object-cover object-center z-0"
        src="https://res.cloudinary.com/digkc0xsk/video/upload/v1771270419/ROBOFESTnew_lj6ak1.mp4"
        autoPlay
        muted={muted}
        loop
        playsInline
        aria-hidden="true"
      />
      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 z-1 bg-black/55" aria-hidden="true" />
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-30 w-full z-1 pointer-events-none">
        <div className="absolute top-0 right-0  h-96 bg-blue-200 w-full rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0  h-96 bg-indigo-200 w-full rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="relative mt-50 z-10 w-full min-w-full px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-24 lg:py-28 xl:py-36">
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
          {/* Left Column - Content */}
          <div className="text-center lg:ml-12 lg:text-left space-y-6 md:space-y-8 lg:space-y-10">
            {/* Main Tagline */}
            <div className="space-y-4 md:space-y-6">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                <span className="block">Build Skills.</span>
                <span className="block">Break Barriers.</span>
                <span className="block text-transparent bg-clip-text bg-linear-to-r from-indigo-300 to-blue-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                  Go Global.
                </span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-gray-100 max-w-xl mx-auto lg:mx-0 leading-relaxed px-4 sm:px-0 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
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
                    alt={`${SITE_CONFIG.name} Logo`}
                    fill
                    className="object-contain rounded-3xl"
                    priority
                    quality={85}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sound toggle - video starts muted (required for autoplay); click to hear sound */}
      <button
        type="button"
        onClick={() => setMuted((m) => !m)}
        className="absolute bottom-6 right-6 z-20 p-2.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label={muted ? 'Unmute video' : 'Mute video'}
      >
        {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>

      {/* Bottom wave decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-linear-to-t from-white to-transparent z-1" />
    </section>
  )
}
