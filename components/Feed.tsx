'use client'

import { useMemo } from 'react'
import Hero from './Hero'
import CourseCard from './CourseCard'
import FAQAccordion from './FAQAccordion'
import {
  Wrench,
  Users,
  Trophy,
  BookOpen,
  Target,
  Eye,
  Award,
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
import type { Course } from '@/types/course'

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
      <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-4">{subtitle}</p>
    )}
  </div>
)

const OLYMPIADS = [
  {
    name: 'GENIUS Olympiad',
    icon: Medal,
    logo: '/olympiads/genius.jpeg',
    color: 'from-green-500 to-teal-500',
    description: 'International high school project competition in science, robotics, business, art, and environmental innovation, hosted in the USA.',
    url: 'https://www.geniusolympiad.org/',
  },
  {
    name: 'NASA Human Exploration Rover Challenge (HERC)',
    icon: Rocket,
    logo: '/olympiads/nasahover.webp',
    color: 'from-slate-700 to-blue-600',
    description: 'NASA-organized global engineering challenge where student teams design, build, and race human-powered rovers over simulated extraterrestrial terrain. (USA)',
    url: 'https://www.nasa.gov/learning-resources/nasa-human-exploration-rover-challenge/',
  },
  {
    name: 'NextGen Olympiad',
    icon: Globe,
    logo: '/olympiads/nextgen.jpg',
    color: 'from-purple-500 to-indigo-500',
    description: 'International STEM competition hosted in Australia, focusing on robotics, AI, innovation, and future technologies for school students.',
    url: 'https://www.nextgenolympiad.com/',
  },
  {
    name: 'World Scholars Cup',
    icon: Trophy,
    logo: '/olympiads/worldscholar.png',
    color: 'from-yellow-500 to-amber-500',
    description: 'Global academic tournament combining debate, collaborative writing, quizzes, and interdisciplinary challenges for students worldwide. (Origin: USA)',
    url: 'https://www.scholarscup.org/',
  },
  {
    name: 'Owlypia International',
    icon: Star,
    logo: '/olympiads/owlypia.jpeg',
    color: 'from-pink-500 to-rose-500',
    description: 'Global online knowledge competition for students aged 7–18, covering science, literature, history, and general knowledge. (Origin: United Kingdom)',
    url: 'https://www.owlypia.org/',
  },
  {
    name: 'Robofest',
    icon: Zap,
    logo: '/olympiads/robofest.png',
    color: 'from-blue-500 to-cyan-500',
    description: 'International robotics competition hosted by Lawrence Technological University, USA, featuring BottleSumo, RoboParade, and autonomous robotics challenges.',
    url: 'https://www.robofest.net/',
  },
] as const

interface FeedProps {
  initialCourses?: Course[]
}

const Feed = ({ initialCourses = [] }: FeedProps) => {
  const features = [
    {
      icon: Wrench,
      title: 'Hands-on Science & Technology',
      description:
        'Build and program real robots and projects that bring STEM concepts to life.',
    },
    {
      icon: Users,
      title: 'Expert Mentors',
      description:
        'Learn from experienced instructors who guide you through every step of your robotics journey.',
    },
    {
      icon: Trophy,
      title: 'Olympiad & Competition Focus',
      description:
        'Prepare for national and international robotics competitions with specialized training programs.',
    },
    {
      icon: BookOpen,
      title: 'One stop ECA Solution',
      description:
        'Join a vibrant community of young innovators sharing knowledge and collaborating on projects.',
    },
  ]

  // Convert Course type to CourseCard props format
  // Filter out archived courses and map to CourseCard format
  // Memoize to prevent unnecessary recalculations
  const courses = useMemo(() => {
    return initialCourses
      .filter((course) => !course.isArchived) // Filter out archived courses (only show active)
      .map((course) => ({
        id: course.id, // Keep ID for React key
        title: course.title,
        level: course.level,
        blurb: course.blurb,
        href: course.href,
        img: course.image,
      }))
  }, [initialCourses])

  const faqItems = [
    {
      question: 'Who is eligible to join Robonauts Club?',
      answer:
        'Robonauts Club welcomes students from grades 3-12 who have an interest in robotics, STEM, and innovation. No prior experience is required for beginner courses.',
    },
    {
      question: 'What age groups do you serve?',
      answer:
        'We serve students aged 8-18 years old, with courses tailored to different age groups and skill levels. Our programs are designed to grow with students from elementary through high school.',
    },
    {
      question: 'Do I need any background knowledge?',
      answer:
        'No background knowledge is required for our beginner courses. We start from the basics and guide you through every step. For intermediate and advanced courses, we recommend completing prerequisite courses first.',
    },
    {
      question: 'Do you provide certificates?',
      answer:
        'Yes! Students who complete our courses receive certificates of completion. We also provide certificates for participation in competitions and special workshops.',
    },
  ]

  return (
    <div className="w-full min-w-full">
      <Hero />

      {/* Why Us Section */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-linear-to-br from-indigo-50/50 via-blue-50/50 to-purple-50/30 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <SectionHeader
            title="Why Choose Robonauts Club?"
            subtitle="Experience the best in robotics education with hands-on learning and expert guidance"
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className="group p-6 sm:p-8 rounded-xl sm:rounded-2xl border border-gray-200 bg-white hover:bg-linear-to-br hover:from-indigo-50/50 hover:to-blue-50/50 hover:border-indigo-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-linear-to-br from-indigo-100 to-blue-100 flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-110 group-hover:from-indigo-200 group-hover:to-blue-200 transition-transform duration-300">
                    <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-500 group-hover:text-indigo-600 transition-colors" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3 group-hover:text-indigo-600 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Choose Your Learning Path Section - MOVED BEFORE Mission & Vision */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-white relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-gray-200 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Choose Your Learning Path with HOPE TTC"
            subtitle="Explore our comprehensive robotics courses designed for all skill levels"
          />
          {courses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No courses available at the moment. Check back soon!</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {courses.map((course, index) => (
                <div
                  key={course.id || index}
                  style={{ animationDelay: `${index * 50}ms` }}
                  className="opacity-0 animate-fade-in-up"
                >
                  <CourseCard title={course.title} level={course.level} blurb={course.blurb} href={course.href} img={course.img} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-linear-to-br from-indigo-50/80 via-blue-50/60 to-purple-50/40 relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-gray-200 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Our Mission & Vision"
            subtitle="Driving innovation in STEM education"
          />
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
            <div className="group bg-white p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl border-2 border-gray-200 hover:border-indigo-200 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-linear-to-br from-indigo-100 to-indigo-200 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Target className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-500" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Mission</h3>
                </div>
                <p className="text-sm sm:text-base md:text-lg text-gray-600 leading-relaxed">
                  To empower young minds through hands-on robotics education,
                  fostering creativity, critical thinking, and innovation. We
                  provide accessible STEM learning opportunities that prepare
                  students for future challenges in technology and engineering.
                </p>
              </div>
            </div>
            <div className="group bg-white p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl border-2 border-gray-200 hover:border-blue-200 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-linear-to-br from-blue-100 to-blue-200 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Eye className="w-6 h-6 sm:w-7 sm:h-7 text-blue-500" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Vision</h3>
                </div>
                <p className="text-sm sm:text-base md:text-lg text-gray-600 leading-relaxed">
                  To help the students shine on the world stage—sending young innovators abroad to compete, collaborate, and stand out like stars. We want every learner to have the opportunity and confidence to bring their talents global and make a meaningful mark through STEM and robotics education.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Collaboration with Olympiads Section */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-linear-to-br from-indigo-50/50 via-blue-50/50 to-purple-50/30 relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-gray-200 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10">
          <SectionHeader
            title="Our Olympiad Participation"
            subtitle="Our teams have previously competed in well-known national and international robotics olympiads, gaining valuable hands-on competition experience that helps us train and mentor current members."
          />

          <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 lg:p-12 border-2 border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300">
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-linear-to-br from-indigo-100 to-blue-100 flex items-center justify-center">
                  <Award className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-500" />
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                  Olympiads We&apos;ve Competed In
                </h3>
              </div>
              <p className="text-sm sm:text-base text-gray-700 mb-4 sm:mb-6 leading-relaxed">
                Robonauts Club has previously participated in prestigious robotics competitions at both national and international levels. These experiences have provided our students with real competition exposure and continue to inform our training programs.
              </p>
            </div>

            {/* Olympiad Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 mb-8 sm:mb-10">
              {OLYMPIADS.map((olympiad, index) => (
                <a
                  key={index}
                  href={olympiad.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col bg-white rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-xl hover:border-indigo-200/80 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                >
                  <div className={`flex items-center justify-center min-h-36 sm:min-h-44 bg-linear-to-br ${olympiad.color} p-5`}>
                    <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-xl bg-white/95 shadow-md flex items-center justify-center p-2 group-hover:scale-105 transition-transform duration-300">
                      <Image
                        src={olympiad.logo}
                        alt={`${olympiad.name} logo`}
                        width={128}
                        height={128}
                        className="object-contain w-full h-full"
                        quality={90}
                        sizes="(max-width: 640px) 96px, 128px"
                      />
                    </div>
                  </div>
                  <div className="p-5 sm:p-6 flex flex-col flex-1">
                    <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors underline decoration-dashed underline-offset-2 decoration-indigo-200 group-hover:decoration-indigo-400">
                      {olympiad.name}
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed flex-1">
                      {olympiad.description}
                    </p>
                  </div>
                </a>
              ))}
            </div>
            {/* Stats Section */}
            <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-10">
              <div className="group bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 border-gray-200 hover:border-indigo-200 text-center hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold bg-linear-to-r from-indigo-500 to-indigo-600 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300">
                  50+
                </div>
                <div className="text-xs sm:text-sm text-gray-600 font-medium">
                  Competition Participants
                </div>
              </div>
              <div className="group bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 border-gray-200 hover:border-blue-200 text-center hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold bg-linear-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300">
                  15+
                </div>
                <div className="text-xs sm:text-sm text-gray-600 font-medium">Awards Won</div>
              </div>
              <div className="group bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 border-gray-200 hover:border-purple-200 text-center col-span-2 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold bg-linear-to-r from-purple-500 to-purple-600 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300">
                  100%
                </div>
                <div className="text-xs sm:text-sm text-gray-600 font-medium">
                  Student Satisfaction Rate
                </div>
              </div>
            </div>

            {/* Scrolling Countries Section */}
            <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-gray-200">
              <div className="overflow-hidden relative rounded-xl bg-gray-50 p-4 border border-gray-200">
                {/* Gradient overlays for fade effect */}
                <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 bg-linear-to-r from-gray-50 to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 bg-linear-to-r from-transparent to-gray-50 z-10 pointer-events-none" />

                <div className="flex animate-scroll-left gap-6 sm:gap-8 md:gap-12">
                  {/* First set of countries */}
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
                    <div
                      key={`country-1-${index}`}
                      className="shrink-0 flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-white rounded-lg sm:rounded-xl border border-indigo-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-300"
                    >
                      <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500 shrink-0" />
                      <span className="text-sm sm:text-base font-semibold text-indigo-600 whitespace-nowrap">
                        {country}
                      </span>
                    </div>
                  ))}
                  {/* Duplicate set for seamless loop */}
                  {['Bangladesh', 'India', 'Thailand', 'Malaysia', 'Singapore', 'Indonesia', 'Philippines', 'Vietnam', 'China', 'Japan', 'South Korea', 'UAE', 'Qatar', 'Saudi Arabia', 'Turkey'].map((country, index) => (
                    <div
                      key={`country-2-${index}`}
                      className="shrink-0 flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-white rounded-lg sm:rounded-xl border border-indigo-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-300"
                    >
                      <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500 shrink-0" />
                      <span className="text-sm sm:text-base font-semibold text-indigo-600 whitespace-nowrap">
                        {country}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-linear-to-br from-blue-50/80 via-indigo-50/60 to-purple-50/40 relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-gray-200 to-transparent" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Frequently Asked Questions"
            subtitle="Everything you need to know about joining Robonauts Club"
          />
          <FAQAccordion items={faqItems} />
        </div>
      </section>

      {/* Optional CTA Section */}
      <section className="py-12 sm:py-16 bg-linear-to-br from-indigo-100 via-blue-100 to-purple-50 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-gray-200 to-transparent" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-block mb-3 sm:mb-4">
            <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 mx-auto text-indigo-400" />
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 sm:mb-3 leading-tight">
            Ready to Start Your Robotics Journey?
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 mb-4 sm:mb-6 max-w-xl mx-auto leading-relaxed">
            Join hundreds of students exploring the exciting world of robotics
            and STEM. Enroll today and unlock your potential!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/events"
              className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-all duration-200 shadow-md hover:shadow-lg text-sm sm:text-base"
            >
              Explore Events
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-white text-gray-700 rounded-lg font-medium border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 text-sm sm:text-base"
            >
              Learn More About Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Feed