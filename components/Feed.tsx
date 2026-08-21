'use client'

import { useMemo } from 'react'
import dynamic from 'next/dynamic'
import { SITE_CONFIG } from '@/lib/site-config'
import Hero from './Hero'
import FeatureBento from './FeatureBento'
import CourseShowcase from './CourseShowcase'
import { HomeSection } from './home-section'
import type { Course } from '@/types/course'
import type { Event } from '@/types/event'
import type { HomepageOrg } from '@/types/homepage-org'
import { Skeleton } from '@/components/ui/skeleton'

const FeedDeferredFromMission = dynamic(() => import('./FeedDeferredFromMission'), {
  loading: () => (
    <div className="min-h-[48vh] bg-slate-950 py-12" aria-busy>
      <div className="mx-auto max-w-7xl space-y-4 px-4 sm:px-6">
        <Skeleton className="h-8 w-1/3 bg-white/10" />
        <Skeleton className="h-4 w-1/2 bg-white/10" />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Skeleton className="h-40 w-full bg-white/10" />
          <Skeleton className="h-40 w-full bg-white/10" />
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
      answer: `${SITE_CONFIG.name} welcomes students from grades 3-12 who have an interest in robotics, STEM, and innovation. No prior experience is required for beginner courses.`,
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
        <FeatureBento />
      </HomeSection>

      <HomeSection tone="white">
        <CourseShowcase courses={courses} />
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
