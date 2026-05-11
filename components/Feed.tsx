'use client'

import { useMemo } from 'react'
import dynamic from 'next/dynamic'
import { SITE_CONFIG } from '@/lib/site-config'
import Hero from './Hero'
import CourseCard from './CourseCard'
import {
  Wrench,
  Users,
  Trophy,
  BookOpen,
} from 'lucide-react'
import type { Course } from '@/types/course'
import type { Event } from '@/types/event'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const FeedDeferredFromMission = dynamic(() => import('./FeedDeferredFromMission'), {
  loading: () => (
    <div className="min-h-[48vh] bg-slate-50/80 py-12" aria-busy>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4">
        <Skeleton className="h-8 w-1/3 mx-auto" />
        <Skeleton className="h-4 w-1/2 mx-auto" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    </div>
  ),
})

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
      <p className="hidden sm:block text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-4">{subtitle}</p>
    )}
  </div>
)

interface FeedProps {
  initialCourses?: Course[]
  initialUpcomingEvents?: Event[]
}

const Feed = ({ initialCourses = [], initialUpcomingEvents = [] }: FeedProps) => {
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
      question: `Who is eligible to join ${SITE_CONFIG.name}?`,
      answer:
        `${SITE_CONFIG.name} welcomes students from grades 3-12 who have an interest in robotics, STEM, and innovation. No prior experience is required for beginner courses.`,
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
      <Hero upcomingEvents={initialUpcomingEvents} />

      {/* Why Us Section - less vertical padding on mobile */}
      <section className="py-8 sm:py-16 md:py-20 lg:py-24 bg-linear-to-br from-indigo-50/50 via-blue-50/50 to-purple-50/30 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <SectionHeader
            title={`Why Choose ${SITE_CONFIG.name}?`}
            subtitle="Experience the best in robotics education with hands-on learning and expert guidance"
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card
                  key={index}
                  className="group hover:bg-linear-to-br hover:from-indigo-50/50 hover:to-blue-50/50 hover:border-indigo-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardContent className="p-4 sm:p-8 flex flex-row sm:flex-col">
                    <div className="shrink-0 w-10 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl bg-linear-to-br from-indigo-100 to-blue-100 flex items-center justify-center mb-0 sm:mb-5 group-hover:scale-110 group-hover:from-indigo-200 group-hover:to-blue-200 transition-transform duration-300">
                      <Icon className="w-5 h-5 sm:w-7 sm:h-7 text-indigo-500 group-hover:text-indigo-600 transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0 ml-3 sm:ml-0">
                      <h3 className="text-base sm:text-xl font-bold text-gray-900 mb-0 sm:mb-3 group-hover:text-indigo-600 transition-colors">
                        {feature.title}
                      </h3>
                      <p className="hidden sm:block text-sm sm:text-base text-gray-600 leading-relaxed">{feature.description}</p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Choose Your Learning Path Section - MOVED BEFORE Mission & Vision */}
      <section className="py-8 sm:py-16 md:py-20 lg:py-24 bg-white relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-gray-200 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Learn with Robonauts"
            subtitle="Explore our comprehensive courses designed for all skill levels"
          />
          {courses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="hidden sm:block text-gray-600">No courses available at the moment. Check back soon!</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
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

      <FeedDeferredFromMission faqItems={faqItems} />
    </div>
  )
}

export default Feed