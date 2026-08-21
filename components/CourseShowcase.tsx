'use client'

import Link from 'next/link'
import { ArrowRight, BookOpen } from 'lucide-react'
import CourseCard from '@/components/CourseCard'
import Reveal from '@/components/Reveal'

type ShowcaseCourse = {
  id: string
  title: string
  level: string
  blurb: string
  href: string
  img?: string
}

/** Prefer Robotics and STEM Lab as the featured program. */
function pickFeaturedIndex(courses: ShowcaseCourse[]) {
  const exact = courses.findIndex((course) => {
    const title = course.title.toLowerCase().replace(/\s+/g, ' ').trim()
    return (
      title.includes('robotics and stem lab') ||
      title.includes('robotics & stem lab') ||
      (title.includes('robotics') && title.includes('stem') && title.includes('lab'))
    )
  })
  if (exact >= 0) return exact

  const robotics = courses.findIndex((course) => {
    const haystack = `${course.title} ${course.blurb}`.toLowerCase()
    return haystack.includes('robotics') || haystack.includes('robot')
  })
  if (robotics >= 0) return robotics

  const webFirst = courses.findIndex((course) => {
    const haystack = `${course.title} ${course.blurb}`.toLowerCase()
    return haystack.includes('web') || haystack.includes('development')
  })
  if (webFirst === 0 && courses.length > 1) return 1
  return 0
}

export default function CourseShowcase({ courses }: { courses: ShowcaseCourse[] }) {
  if (courses.length === 0) {
    return (
      <div>
        <SectionHeader />
        <div className="py-12 text-center">
          <BookOpen className="mx-auto mb-3 size-12 text-slate-300" />
          <p className="hidden text-gray-600 sm:block">
            No courses available at the moment. Check back soon!
          </p>
        </div>
      </div>
    )
  }

  const featuredIndex = pickFeaturedIndex(courses)
  const featured = courses[featuredIndex]
  const others = courses.filter((_, index) => index !== featuredIndex)

  return (
    <div>
      <SectionHeader showExplore={others.length > 2} />

      <Reveal>
        <CourseCard
          title={featured.title}
          level={featured.level}
          blurb={featured.blurb}
          href={featured.href}
          img={featured.img}
          variant="featured"
        />
      </Reveal>

      {others.length > 0 ? (
        <div
          id="course-grid"
          className="mt-4 grid gap-4 sm:mt-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {others.map((course, index) => (
            <Reveal key={course.id} delayMs={index * 70}>
              <CourseCard
                title={course.title}
                level={course.level}
                blurb={course.blurb}
                href={course.href}
                img={course.img}
              />
            </Reveal>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function SectionHeader({ showExplore = false }: { showExplore?: boolean }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:mb-10 md:mb-12 md:flex-row md:items-end md:justify-between">
      <Reveal className="max-w-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-indigo-600 sm:text-xs">
          Programs
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl md:text-5xl">
          Learn with Robonauts
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-gray-600 sm:text-base">
          Discover pathways designed for every stage — from first build to competition-ready.
        </p>
      </Reveal>
      {showExplore ? (
        <Link
          href="#course-grid"
          className="group inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 transition-colors hover:text-indigo-800"
        >
          Explore all
          <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
        </Link>
      ) : null}
    </div>
  )
}
