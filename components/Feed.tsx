'use client'

import { useMemo } from 'react'
import dynamic from 'next/dynamic'
import { SITE_CONFIG } from '@/lib/site-config'
import Hero from './Hero'
import CourseCard from './CourseCard'
import { HomeSection, SubsectionIntro } from './home-section'
import {
  Wrench,
  Users,
  Trophy,
  BookOpen,
} from 'lucide-react'
import type { Course } from '@/types/course'
import type { Event } from '@/types/event'
import type { HomepageOrg } from '@/types/homepage-org'
import { Skeleton } from '@/components/ui/skeleton'

const FeedDeferredFromMission = dynamic(() => import('./FeedDeferredFromMission'), {
  loading: () => (
    <div className="min-h-[48vh] bg-slate-50/80 py-12" aria-busy>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    </div>
  ),
})

interface FeedProps {
  initialCourses?: Course[]
  initialUpcomingEvents?: Event[]
  initialPartners?: HomepageOrg[]
  initialWorkshopSchools?: HomepageOrg[]
}

const Feed = ({
  initialCourses = [],
  initialUpcomingEvents = [],
  initialPartners = [],
  initialWorkshopSchools = [],
}: FeedProps) => {
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

  const courses = useMemo(() => {
    return initialCourses
      .filter((course) => !course.isArchived)
      .map((course) => ({
        id: course.id,
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

      <HomeSection tone="wash" showOrbs>
        <SubsectionIntro
          title={`Why Choose ${SITE_CONFIG.name}?`}
          description="Hands-on learning, expert mentors, and competition-ready programs for young innovators."
        />
        <ul className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 list-none p-0 m-0">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <li
                key={feature.title}
                className="opacity-0 animate-fade-in-up"
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <div className="group h-full rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-4 sm:px-5 sm:py-6 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-white hover:shadow-[0_12px_28px_-16px_rgba(79,70,229,0.35)]">
                  <div className="flex flex-row sm:flex-col gap-3 sm:gap-4">
                    <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-50 ring-1 ring-slate-200/70 flex items-center justify-center transition-all duration-300 group-hover:bg-white group-hover:ring-indigo-200">
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">
                        {feature.title}
                      </h3>
                      <p className="hidden sm:block mt-2 text-sm text-gray-600 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </HomeSection>

      <HomeSection tone="white">
        <SubsectionIntro
          title="Learn with Robonauts"
          description="Explore our comprehensive courses designed for all skill levels."
        />
        {courses.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="hidden sm:block text-gray-600">
              No courses available at the moment. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
            {courses.map((course, index) => (
              <div
                key={course.id || index}
                style={{ animationDelay: `${index * 50}ms` }}
                className="opacity-0 animate-fade-in-up"
              >
                <CourseCard
                  title={course.title}
                  level={course.level}
                  blurb={course.blurb}
                  href={course.href}
                  img={course.img}
                />
              </div>
            ))}
          </div>
        )}
      </HomeSection>

      <FeedDeferredFromMission
        faqItems={faqItems}
        partners={initialPartners.map((org) => ({
          name: org.name,
          logo: org.logoUrl,
        }))}
        workshopSchools={initialWorkshopSchools.map((org) => ({
          name: org.name,
          logo: org.logoUrl,
        }))}
      />
    </div>
  )
}

export default Feed
