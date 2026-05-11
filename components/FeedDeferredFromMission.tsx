'use client'

import { SITE_CONFIG } from '@/lib/site-config'
import FAQAccordion from './FAQAccordion'
import {
  Trophy,
  Target,
  Eye,
  Sparkles,
  Globe,
  Zap,
  Rocket,
  Star,
  Medal,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const SectionHeader = ({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}) => (
  <div className="text-center mb-8 sm:mb-10 md:mb-12">
    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
      {title}
    </h2>
    {subtitle && (
      <p className="hidden sm:block text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-4">
        {subtitle}
      </p>
    )}
  </div>
)

const OLYMPIADS = [
  {
    name: 'GENIUS Olympiad',
    icon: Medal,
    logo: '/olympiads/genius.jpeg',
    color: 'from-green-500 to-teal-500',
    description:
      'International high school project competition in science, robotics, business, art, and environmental innovation, hosted in the USA.',
    url: 'https://www.geniusolympiad.org/',
  },
  {
    name: 'International Greenwich Olympiad (IGO)',
    icon: Globe,
    logo: '/olympiads/greenwitch.jpg',
    color: 'from-blue-500 to-indigo-500',
    description:
      'Global STEAM competition held in the UK, where students present innovative projects in science, engineering, robotics, business, and social initiatives.',
    url: 'https://www.igo-official.org/',
  },
  {
    name: 'NASA Human Exploration Rover Challenge (HERC)',
    icon: Rocket,
    logo: '/olympiads/nasahover.webp',
    color: 'from-slate-700 to-blue-600',
    description:
      'NASA-organized global engineering challenge where student teams design, build, and race human-powered rovers over simulated extraterrestrial terrain. (USA)',
    url: 'https://www.nasa.gov/learning-resources/nasa-human-exploration-rover-challenge/',
  },
  {
    name: 'NextGen Olympiad',
    icon: Globe,
    logo: '/olympiads/nextgen.jpg',
    color: 'from-purple-500 to-indigo-500',
    description:
      'International STEM competition hosted in Australia, focusing on robotics, AI, innovation, and future technologies for school students.',
    url: 'https://www.nextgenolympiad.com/',
  },
  {
    name: 'World Scholars Cup',
    icon: Trophy,
    logo: '/olympiads/worldscholar.png',
    color: 'from-yellow-500 to-amber-500',
    description:
      'Global academic tournament combining debate, collaborative writing, quizzes, and interdisciplinary challenges for students worldwide. (Origin: USA)',
    url: 'https://www.scholarscup.org/',
  },
  {
    name: 'Owlypia International',
    icon: Star,
    logo: '/olympiads/owlypia.jpeg',
    color: 'from-pink-500 to-rose-500',
    description:
      'Global online knowledge competition for students aged 7–18, covering science, literature, history, and general knowledge. (Origin: United Kingdom)',
    url: 'https://www.owlypia.org/',
  },
  {
    name: 'Robofest',
    icon: Zap,
    logo: '/olympiads/robofest.png',
    color: 'from-blue-500 to-cyan-500',
    description:
      'International robotics competition hosted by Lawrence Technological University, USA, featuring BottleSumo, RoboParade, and autonomous robotics challenges.',
    url: 'https://www.robofest.net/',
  },
] as const

export type FeedFaqItem = { question: string; answer: string }

export default function FeedDeferredFromMission({
  faqItems,
}: {
  faqItems: FeedFaqItem[]
}) {
  return (
    <>
      <section className="py-8 sm:py-16 md:py-20 lg:py-24 bg-linear-to-br from-indigo-50/80 via-blue-50/60 to-purple-50/40 relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-gray-200 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Our Mission & Vision"
            subtitle="Driving innovation in STEM education"
          />
          <div className="grid md:grid-cols-2 gap-4 sm:gap-8">
            <Card className="group border-2 hover:border-indigo-200 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardContent className="p-4 sm:p-8 md:p-10 relative z-10">
                <div className="flex items-center gap-2 sm:gap-4 mb-2 sm:mb-6">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl bg-linear-to-br from-indigo-100 to-indigo-200 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Target className="w-5 h-5 sm:w-7 sm:h-7 text-indigo-500" />
                  </div>
                  <h3 className="text-lg sm:text-2xl font-bold text-gray-900">Mission</h3>
                </div>
                <p className="hidden sm:block text-sm sm:text-base md:text-lg text-gray-600 leading-relaxed">
                  To empower young minds through hands-on robotics education, fostering creativity,
                  critical thinking, and innovation. We provide accessible STEM learning opportunities
                  that prepare students for future challenges in technology and engineering.
                </p>
              </CardContent>
            </Card>
            <Card className="group border-2 hover:border-blue-200 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardContent className="p-4 sm:p-8 md:p-10 relative z-10">
                <div className="flex items-center gap-2 sm:gap-4 mb-2 sm:mb-6">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl bg-linear-to-br from-blue-100 to-blue-200 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Eye className="w-5 h-5 sm:w-7 sm:h-7 text-blue-500" />
                  </div>
                  <h3 className="text-lg sm:text-2xl font-bold text-gray-900">Vision</h3>
                </div>
                <p className="hidden sm:block text-sm sm:text-base md:text-lg text-gray-600 leading-relaxed">
                  To help the students shine on the world stage—sending young innovators abroad to
                  compete, collaborate, and stand out like stars. We want every learner to have the
                  opportunity and confidence to bring their talents global and make a meaningful mark
                  through STEM and robotics education.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-16 md:py-20 lg:py-24 bg-linear-to-br from-indigo-50/50 via-blue-50/50 to-purple-50/30 relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-gray-200 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10">
          <SectionHeader
            title="Our Olympiad Participation"
            subtitle="Our teams have previously competed in well-known national and international robotics olympiads, gaining valuable hands-on competition experience that helps us train and mentor current members."
          />

          <Card className="border-2 shadow-sm hover:shadow-xl transition-all duration-300">
            <CardContent className="p-4 sm:p-8 md:p-10 lg:p-12">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8 mb-6 sm:mb-10">
                {OLYMPIADS.map((olympiad, index) => (
                  <Card
                    key={index}
                    className="group flex flex-col shadow-md hover:shadow-xl hover:border-indigo-100 transition-all duration-300 overflow-hidden p-0"
                  >
                    <div
                      className={`relative flex items-center justify-center min-h-[100px] sm:min-h-[160px] bg-linear-to-br ${olympiad.color} p-4 sm:p-8`}
                    >
                      <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors duration-300" aria-hidden />
                      <div className="relative w-20 h-20 sm:w-36 sm:h-36 rounded-xl sm:rounded-2xl bg-white/98 shadow-lg flex items-center justify-center p-2 sm:p-3 ring-2 ring-white/50">
                        <Image
                          src={olympiad.logo}
                          alt={`${olympiad.name} logo`}
                          width={144}
                          height={144}
                          className="object-contain w-full h-full"
                          quality={90}
                          sizes="(max-width: 640px) 112px, 144px"
                        />
                      </div>
                    </div>
                    <CardContent className="p-3 sm:p-6 flex flex-col flex-1 border-t border-gray-100">
                      <h4 className="text-sm sm:text-lg font-bold text-gray-900 mb-0 sm:mb-2.5">
                        {olympiad.name}
                      </h4>
                      <p className="hidden sm:block text-xs sm:text-sm text-gray-600 leading-relaxed flex-1">
                        {olympiad.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-6 mb-6 sm:mb-10">
                <Card className="group border-2 hover:border-indigo-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                  <CardContent className="p-3 sm:p-6 text-center">
                    <div className="text-2xl sm:text-4xl md:text-5xl font-bold bg-linear-to-r from-indigo-500 to-indigo-600 bg-clip-text text-transparent mb-0 sm:mb-2 group-hover:scale-110 transition-transform duration-300">
                      50+
                    </div>
                    <div className="hidden sm:block text-xs sm:text-sm text-gray-600 font-medium">
                      Competition Participants
                    </div>
                  </CardContent>
                </Card>
                <Card className="group border-2 hover:border-blue-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                  <CardContent className="p-3 sm:p-6 text-center">
                    <div className="text-2xl sm:text-4xl md:text-5xl font-bold bg-linear-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent mb-0 sm:mb-2 group-hover:scale-110 transition-transform duration-300">
                      15+
                    </div>
                    <div className="hidden sm:block text-xs sm:text-sm text-gray-600 font-medium">Awards Won</div>
                  </CardContent>
                </Card>
                <Card className="group border-2 hover:border-purple-200 col-span-2 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                  <CardContent className="p-3 sm:p-6 text-center">
                    <div className="text-2xl sm:text-4xl md:text-5xl font-bold bg-linear-to-r from-purple-500 to-purple-600 bg-clip-text text-transparent mb-0 sm:mb-2 group-hover:scale-110 transition-transform duration-300">
                      100%
                    </div>
                    <div className="hidden sm:block text-xs sm:text-sm text-gray-600 font-medium">
                      Student Satisfaction Rate
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="hidden sm:block mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-gray-200">
                <div className="overflow-hidden relative rounded-xl bg-gray-50 p-4 border border-gray-200">
                  <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 bg-linear-to-r from-gray-50 to-transparent z-10 pointer-events-none" />
                  <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 bg-linear-to-r from-transparent to-gray-50 z-10 pointer-events-none" />

                  <div className="flex animate-scroll-left gap-6 sm:gap-8 md:gap-12">
                    {[
                      'Bangladesh',
                      'Thailand',
                      'Malaysia',
                      'Singapore',
                      'China',
                      'Japan',
                      'South Korea',
                      'Qatar',
                      'Turkey',
                      'USA',
                      'Canada',
                      'Australia',
                      'England',
                    ].map((country, index) => (
                      <Badge
                        key={`country-1-${index}`}
                        variant="outline"
                        className="shrink-0 flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-white border-indigo-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-300 text-sm sm:text-base font-semibold text-indigo-600"
                      >
                        <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500 shrink-0" />
                        <span className="whitespace-nowrap">{country}</span>
                      </Badge>
                    ))}
                    {[
                      'Bangladesh',
                      'India',
                      'Thailand',
                      'Malaysia',
                      'Singapore',
                      'Indonesia',
                      'Philippines',
                      'Vietnam',
                      'China',
                      'Japan',
                      'South Korea',
                      'UAE',
                      'Qatar',
                      'Saudi Arabia',
                      'Turkey',
                    ].map((country, index) => (
                      <Badge
                        key={`country-2-${index}`}
                        variant="outline"
                        className="shrink-0 flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-white border-indigo-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-300 text-sm sm:text-base font-semibold text-indigo-600"
                      >
                        <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500 shrink-0" />
                        <span className="whitespace-nowrap">{country}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-8 sm:py-16 md:py-20 lg:py-24 bg-linear-to-br from-blue-50/80 via-indigo-50/60 to-purple-50/40 relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-gray-200 to-transparent" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Frequently Asked Questions"
            subtitle={`Everything you need to know about joining ${SITE_CONFIG.name}`}
          />
          <FAQAccordion items={faqItems} />
        </div>
      </section>

      <section className="py-8 sm:py-16 bg-linear-to-br from-indigo-100 via-blue-100 to-purple-50 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-gray-200 to-transparent" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-block mb-2 sm:mb-4">
            <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 mx-auto text-indigo-400" />
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 sm:mb-3 leading-tight">
            Ready to Start Your Robotics Journey?
          </h2>
          <p className="hidden sm:block text-sm sm:text-base md:text-lg text-gray-600 mb-4 sm:mb-6 max-w-xl mx-auto leading-relaxed">
            Join hundreds of students exploring the exciting world of robotics and STEM. Enroll today
            and unlock your potential!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              asChild
              className="bg-indigo-500 text-white hover:bg-indigo-600 shadow-md hover:shadow-lg text-sm sm:text-base"
            >
              <Link href="/events" prefetch={false}>
                Explore Events
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 text-sm sm:text-base"
            >
              <Link href="/about" prefetch={false}>
                Learn More About Us
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
