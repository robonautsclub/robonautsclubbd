'use client'

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
} from 'lucide-react'
import Link from 'next/link'
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

interface FeedProps {
  initialCourses?: Course[]
}

const Feed = ({ initialCourses = [] }: FeedProps) => {
  const features = [
    {
      icon: Wrench,
      title: 'Hands-on Robotics',
      description:
        'Build and program real robots through practical projects that bring STEM concepts to life.',
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
      title: 'Community Learning',
      description:
        'Join a vibrant community of young innovators sharing knowledge and collaborating on projects.',
    },
  ]

  // Convert Course type to CourseCard props format
  // Filter out archived courses and map to CourseCard format
  const courses = initialCourses
    .filter((course) => !course.isArchived) // Filter out archived courses (only show active)
    .map((course) => ({
      id: course.id, // Keep ID for React key
      title: course.title,
      level: course.level,
      blurb: course.blurb,
      href: course.href,
      img: course.image,
    }))

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
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-white relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-gray-200 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Our Olympiad Participation"
            subtitle="Our teams have previously competed in well-known national and international robotics olympiads, gaining valuable hands-on competition experience that helps us train and mentor current members."
          />
          <div className="bg-linear-to-br from-indigo-50 via-blue-50 to-purple-50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 border-2 border-indigo-100 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <Award className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-500" />
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Olympiads We&apos;ve Competed In
                </h3>
              </div>
              <p className="text-sm sm:text-base text-gray-700 mb-4 sm:mb-6 leading-relaxed">
                Robonauts Club has previously participated in prestigious robotics competitions at both national and international levels. These experiences have provided our students with real competition exposure and continue to inform our training programs.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="group bg-white p-4 sm:p-6 rounded-lg sm:rounded-xl border border-gray-200 hover:border-indigo-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5">
                <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                  World Robot Olympiad (WRO)
                </h4>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Global robotics competition where teams design and build robots to solve themed challenges.
                </p>
              </div>
              <div className="group bg-white p-6 rounded-xl border border-gray-200 hover:border-indigo-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5">
                <h4 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                  FIRST LEGO League Challenge (FLL)
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  International competition for elementary and middle school students focused on robotics and real-world problem solving.
                </p>
              </div>
              <div className="group bg-white p-6 rounded-xl border border-gray-200 hover:border-indigo-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5">
                <h4 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                  FIRST Tech Challenge (FTC)
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Competition for middle and high school students involving more advanced robot design and gameplay.
                </p>
              </div>
              <div className="group bg-white p-6 rounded-xl border border-gray-200 hover:border-indigo-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5">
                <h4 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                  FIRST Robotics Competition (FRC)
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  High school–level global competition emphasizing large-scale robot engineering and teamwork.
                </p>
              </div>
              <div className="group bg-white p-6 rounded-xl border border-gray-200 hover:border-indigo-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5">
                <h4 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                  VEX IQ Robotics Competition
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Beginner-friendly robotics competition with game-based challenges, including divisions for younger students.
                </p>
              </div>
              <div className="group bg-white p-6 rounded-xl border border-gray-200 hover:border-indigo-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5">
                <h4 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                  Technoxian – World Robotics Championship Series
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  International robotics championship featuring multiple competitive categories such as Robo Race and Robo Soccer.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:gap-6 mt-6 sm:mt-10">
              <div className="group bg-white p-4 sm:p-6 rounded-lg sm:rounded-xl border-2 border-gray-200 hover:border-indigo-200 text-center hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                <div className="text-3xl sm:text-4xl font-bold bg-linear-to-r from-indigo-500 to-indigo-600 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300">
                  50+
                </div>
                <div className="text-xs sm:text-sm text-gray-600 font-medium">
                  Competition Participants
                </div>
              </div>
              <div className="group bg-white p-4 sm:p-6 rounded-lg sm:rounded-xl border-2 border-gray-200 hover:border-blue-200 text-center hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                <div className="text-3xl sm:text-4xl font-bold bg-linear-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300">
                  15+
                </div>
                <div className="text-xs sm:text-sm text-gray-600 font-medium">Awards Won</div>
              </div>
              <div className="group bg-white p-4 sm:p-6 rounded-lg sm:rounded-xl border-2 border-gray-200 hover:border-purple-200 text-center col-span-2 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                <div className="text-3xl sm:text-4xl font-bold bg-linear-to-r from-purple-500 to-purple-600 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300">
                  100%
                </div>
                <div className="text-xs sm:text-sm text-gray-600 font-medium">
                  Student Satisfaction Rate
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