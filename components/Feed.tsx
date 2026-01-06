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

const SectionHeader = ({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}) => (
  <div className="text-center mb-12">
    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
      {title}
    </h2>
    {subtitle && (
      <p className="text-lg text-gray-600 max-w-2xl mx-auto">{subtitle}</p>
    )}
  </div>
)

const Feed = () => {
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

  const courses = [
    {
        title: 'Robotics & STEM Lab',
        level: 'Junior–Senior',
        blurb: 'Hands-on projects with sensors, coding, and simple robots.',
        href: '/courses/robotics',
        img: '/images/feed/robotics.jpg'
      },
    
      // New: 3D Modelling
      {
        title: '3D Modelling & Animation',
        level: 'Beginner–Advanced',
        blurb:
          'Blender-based 3D modelling, texturing, lighting, and animation with portfolio projects.',
        href: '/courses/modelling',
        img: '/images/feed/threed.jpeg'
      },
    
      // New: Game Development
      {
        title: 'Game Development',
        level: 'Beginner–Intermediate',
        blurb:
          'Learn Unity-style game development, C# scripting, and build playable projects.',
        href: '/courses/gamedev',
        img: '/images/feed/gamedev.jpeg'
      },
      {
        title: 'Web Development',
        level: 'Beginner–Intermediate',
        blurb:
          'Modern HTML, CSS, JavaScript, React, and Next.js with deployed portfolio sites.',
        href: '/courses/webdev',
        img: '/images/feed/webdev.png'
      },{
        title: 'Spoken English',
        level: 'All Levels',
        blurb: 'Fluency drills, pronunciation labs, and real-life roleplays.',
        href: '/courses/spokenenglish',
        img: '/images/feed/learn-english.jpeg'
      },
    
      // New: IELTS (general complete program)
      {
        title: 'IELTS Complete',
        level: 'For All',
        blurb:
          'All four modules with section-wise strategies and weekly mock tests.',
        href: '/courses/ielts',
        img: '/images/feed/ielts.jpeg'
      },
    
  ]

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
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Why Choose Robonauts Club?"
            subtitle="Experience the best in robotics education with hands-on learning and expert guidance"
          />
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className="p-6 rounded-2xl border border-gray-200 bg-gray-50 hover:bg-white hover:shadow-md transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Our Mission & Vision"
            subtitle="Driving innovation in STEM education"
          />
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-8 h-8 text-indigo-600" />
                <h3 className="text-2xl font-bold text-gray-900">Mission</h3>
              </div>
              <p className="text-gray-600 leading-relaxed">
                To empower young minds through hands-on robotics education,
                fostering creativity, critical thinking, and innovation. We
                provide accessible STEM learning opportunities that prepare
                students for future challenges in technology and engineering.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Eye className="w-8 h-8 text-blue-600" />
                <h3 className="text-2xl font-bold text-gray-900">Vision</h3>
              </div>
              <p className="text-gray-600 leading-relaxed">
                To become Bangladesh&apos;s leading robotics education center,
                inspiring the next generation of engineers, scientists, and
                innovators. We envision a future where every student has access
                to quality STEM education and the tools to shape tomorrow.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Collaboration with Olympiads Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Our Olympiad Participation"
            subtitle="Our teams have previously competed in well-known national and international robotics olympiads, gaining valuable hands-on competition experience that helps us train and mentor current members."
          />
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-3xl p-8 md:p-12 border border-indigo-100">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <Award className="w-10 h-10 text-indigo-600" />
                <h3 className="text-2xl font-bold text-gray-900">
                  Olympiads We&apos;ve Competed In
                </h3>
              </div>
              <p className="text-gray-700 mb-6 leading-relaxed">
                Robonauts Club has previously participated in prestigious robotics competitions at both national and international levels. These experiences have provided our students with real competition exposure and continue to inform our training programs.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h4 className="text-lg font-bold text-gray-900 mb-2">
                  World Robot Olympiad (WRO)
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Global robotics competition where teams design and build robots to solve themed challenges.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h4 className="text-lg font-bold text-gray-900 mb-2">
                  FIRST LEGO League Challenge (FLL)
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  International competition for elementary and middle school students focused on robotics and real-world problem solving.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h4 className="text-lg font-bold text-gray-900 mb-2">
                  FIRST Tech Challenge (FTC)
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Competition for middle and high school students involving more advanced robot design and gameplay.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h4 className="text-lg font-bold text-gray-900 mb-2">
                  FIRST Robotics Competition (FRC)
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  High school–level global competition emphasizing large-scale robot engineering and teamwork.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h4 className="text-lg font-bold text-gray-900 mb-2">
                  VEX IQ Robotics Competition
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Beginner-friendly robotics competition with game-based challenges, including divisions for younger students.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h4 className="text-lg font-bold text-gray-900 mb-2">
                  Technoxian – World Robotics Championship Series
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  International robotics championship featuring multiple competitive categories such as Robo Race and Robo Soccer.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="bg-white p-6 rounded-xl border border-gray-200 text-center">
                <div className="text-3xl font-bold text-indigo-600 mb-2">
                  50+
                </div>
                <div className="text-sm text-gray-600">
                  Competition Participants
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-200 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  15+
                </div>
                <div className="text-sm text-gray-600">Awards Won</div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-200 text-center col-span-2">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  100%
                </div>
                <div className="text-sm text-gray-600">
                  Student Satisfaction Rate
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Choose Your Learning Path Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Choose Your Learning Path with HOPETTC"
            subtitle="Explore our comprehensive robotics courses designed for all skill levels"
          />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course, index) => (
              <CourseCard key={index} {...course} />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Frequently Asked Questions"
            subtitle="Everything you need to know about joining Robonauts Club"
          />
          <FAQAccordion items={faqItems} />
        </div>
      </section>

      {/* Optional CTA Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-6 text-indigo-200" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Your Robotics Journey?
          </h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
            Join hundreds of students exploring the exciting world of robotics
            and STEM. Enroll today and unlock your potential!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/events"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg hover:shadow-xl"
            >
              Explore Events
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-indigo-700 text-white rounded-lg font-semibold border-2 border-indigo-500 hover:bg-indigo-800 transition-colors"
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