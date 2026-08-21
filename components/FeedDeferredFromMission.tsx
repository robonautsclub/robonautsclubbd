'use client'

import { useState } from 'react'
import { SITE_CONFIG } from '@/lib/site-config'
import FAQAccordion from './FAQAccordion'
import { HomeSection, SubsectionIntro } from './home-section'
import {
  Trophy,
  Globe,
  Zap,
  Rocket,
  Star,
  Medal,
} from 'lucide-react'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function LogoMark({
  name,
  logo,
  size = 'md',
}: {
  name: string
  logo?: string
  size?: 'md' | 'lg'
}) {
  const [failed, setFailed] = useState(false)
  const showImage = Boolean(logo) && !failed
  const box =
    size === 'lg'
      ? 'w-14 h-14 sm:w-16 sm:h-16'
      : 'w-12 h-12 sm:w-14 sm:h-14'

  return (
    <div
      className={`relative ${box} rounded-xl bg-slate-50 ring-1 ring-slate-200/70 flex items-center justify-center p-2.5 transition-all duration-300 group-hover:bg-white group-hover:ring-indigo-200 group-hover:shadow-sm`}
    >
      {showImage ? (
        <Image
          src={logo!}
          alt={`${name} logo`}
          width={64}
          height={64}
          className="object-contain w-full h-full opacity-80 group-hover:opacity-100 transition-opacity duration-300"
          quality={90}
          sizes="(max-width: 640px) 56px, 64px"
          onError={() => setFailed(true)}
        />
      ) : (
        <span
          className="text-xs sm:text-sm font-semibold text-indigo-600/80 tracking-wide"
          aria-hidden
        >
          {getInitials(name)}
        </span>
      )}
    </div>
  )
}

type NamedLogo = { name: string; logo?: string }

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

/** Premium partner logo wall — equal cells, quiet borders, soft lift on hover. */
function PartnerLogoGrid({ items }: { items: NamedLogo[] }) {
  return (
    <ul className="mx-auto grid max-w-5xl grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 list-none p-0 justify-items-center">
      {items.map((item, index) => (
        <li
          key={`${item.name}-${index}`}
          className="opacity-0 animate-fade-in-up w-full"
          style={{ animationDelay: `${index * 60}ms` }}
        >
          <div className="group h-full w-full rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-sm px-3 py-5 sm:px-4 sm:py-6 flex flex-col items-center justify-center gap-3 text-center transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-white hover:shadow-[0_12px_28px_-16px_rgba(79,70,229,0.35)]">
            <LogoMark name={item.name} logo={item.logo} />
            <span className="text-xs sm:text-sm font-medium text-gray-700 group-hover:text-gray-900 leading-snug transition-colors duration-300">
              {item.name}
            </span>
          </div>
        </li>
      ))}
    </ul>
  )
}

/** School reach grid — slightly larger tiles with name emphasis for seminars/workshops. */
function SchoolReachGrid({ items }: { items: NamedLogo[] }) {
  return (
    <ul className="mx-auto grid max-w-4xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 list-none p-0 justify-items-stretch">
      {items.map((item, index) => (
        <li
          key={`${item.name}-${index}`}
          className="opacity-0 animate-fade-in-up w-full"
          style={{ animationDelay: `${index * 70}ms` }}
        >
          <div className="group h-full rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-4 sm:px-5 sm:py-5 flex items-center gap-4 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_12px_28px_-16px_rgba(37,99,235,0.3)]">
            <LogoMark name={item.name} logo={item.logo} size="lg" />
            <div className="min-w-0 text-left">
              <span className="block text-sm sm:text-base font-semibold text-gray-900 leading-snug truncate">
                {item.name}
              </span>
              <span className="mt-0.5 block text-xs text-gray-500 group-hover:text-indigo-600/80 transition-colors duration-300">
                Seminar & workshop host
              </span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}

/** Olympiad participation tiles — linked, accent bar, quiet premium surface. */
function OlympiadGrid({
  items,
}: {
  items: readonly {
    name: string
    logo: string
    color: string
    description: string
    url: string
  }[]
}) {
  return (
    <ul className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 list-none p-0 m-0">
      {items.map((olympiad, index) => (
        <li
          key={olympiad.name}
          className="opacity-0 animate-fade-in-up"
          style={{ animationDelay: `${index * 60}ms` }}
        >
          <a
            href={olympiad.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-white hover:shadow-[0_12px_28px_-16px_rgba(79,70,229,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
          >
            <div
              className={`h-1 w-full bg-linear-to-r ${olympiad.color}`}
              aria-hidden
            />
            <div className="flex flex-1 flex-col p-4 sm:p-5">
              <div className="mb-3 sm:mb-4 flex items-center justify-center rounded-xl bg-slate-50 ring-1 ring-slate-100 py-4 sm:py-5 transition-colors duration-300 group-hover:bg-white group-hover:ring-indigo-100">
                <div className="relative h-16 w-16 sm:h-20 sm:w-20">
                  <Image
                    src={olympiad.logo}
                    alt={`${olympiad.name} logo`}
                    fill
                    className="object-contain opacity-90 transition-opacity duration-300 group-hover:opacity-100"
                    quality={90}
                    sizes="(max-width: 640px) 64px, 80px"
                  />
                </div>
              </div>
              <h4 className="text-sm sm:text-base font-semibold text-gray-900 leading-snug group-hover:text-indigo-700 transition-colors duration-300">
                {olympiad.name}
              </h4>
              <p className="mt-1.5 hidden sm:block text-xs sm:text-sm text-gray-600 leading-relaxed flex-1">
                {olympiad.description}
              </p>
            </div>
          </a>
        </li>
      ))}
    </ul>
  )
}

const OLYMPIAD_STATS = [
  { value: '50+', label: 'Competition Participants', accent: 'from-indigo-500 to-indigo-600' },
  { value: '15+', label: 'Awards Won', accent: 'from-blue-500 to-blue-600' },
  { value: '100%', label: 'Student Satisfaction Rate', accent: 'from-violet-500 to-indigo-500' },
] as const

const MARQUEE_COUNTRIES_A = [
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
] as const

const MARQUEE_COUNTRIES_B = [
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
] as const

function OlympiadImpactStats() {
  return (
    <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-slate-200/80">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
        {OLYMPIAD_STATS.map((stat, index) => (
          <div
            key={stat.label}
            className={`text-center ${index === 2 ? 'col-span-2 sm:col-span-1' : ''}`}
          >
            <div
              className={`text-2xl sm:text-3xl md:text-4xl font-bold bg-linear-to-r ${stat.accent} bg-clip-text text-transparent`}
            >
              {stat.value}
            </div>
            <div className="mt-1 text-xs sm:text-sm text-gray-600 font-medium">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CountriesMarquee() {
  return (
    <div className="hidden sm:block mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-slate-200/80">
      <p className="mb-4 text-xs sm:text-sm font-medium text-gray-500 tracking-wide uppercase">
        Countries our teams have reached
      </p>
      <div className="overflow-hidden relative py-2">
        <div
          className="absolute left-0 top-0 bottom-0 w-12 sm:w-20 bg-linear-to-r from-slate-50 to-transparent z-10 pointer-events-none"
          aria-hidden
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-12 sm:w-20 bg-linear-to-r from-transparent to-slate-50 z-10 pointer-events-none"
          aria-hidden
        />
        <div className="flex animate-scroll-left gap-3 sm:gap-4">
          {[...MARQUEE_COUNTRIES_A, ...MARQUEE_COUNTRIES_B, ...MARQUEE_COUNTRIES_A, ...MARQUEE_COUNTRIES_B].map(
            (country, index) => (
              <Badge
                key={`country-${index}`}
                variant="outline"
                className="shrink-0 flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/80 border-slate-200 text-sm font-medium text-slate-700 hover:border-indigo-200 hover:text-indigo-700 transition-colors duration-300"
              >
                <Globe className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="whitespace-nowrap">{country}</span>
              </Badge>
            )
          )}
        </div>
      </div>
    </div>
  )
}

export default function FeedDeferredFromMission({
  faqItems,
  partners = [],
  workshopSchools = [],
}: {
  faqItems: FeedFaqItem[]
  partners?: NamedLogo[]
  workshopSchools?: NamedLogo[]
}) {
  return (
    <>
      <HomeSection tone="soft" showOrbs>
        <SubsectionIntro
          title="Our Olympiad Participation"
          description="Our teams have competed in leading national and international olympiads—experience that shapes how we train and mentor members today."
        />
        <OlympiadGrid items={OLYMPIADS} />
        <OlympiadImpactStats />
        <CountriesMarquee />
      </HomeSection>

      <HomeSection tone="white" maxWidth="4xl">
        <SubsectionIntro
          title="Frequently Asked Questions"
          description={`Everything you need to know about joining ${SITE_CONFIG.name}`}
        />
        <FAQAccordion items={faqItems} />
      </HomeSection>

      {(partners.length > 0 || workshopSchools.length > 0) && (
        <HomeSection
          tone="wash"
          showOrbs
          containerClassName="space-y-12 sm:space-y-16 md:space-y-20"
        >
          {partners.length > 0 ? (
            <div className="flex flex-col items-center">
              <SubsectionIntro
                as="h3"
                align="center"
                title="Our Strategic Partners"
                description="Organizations that collaborate with us to expand STEM access, strengthen programs, and support young innovators."
              />
              <PartnerLogoGrid items={partners} />
            </div>
          ) : null}

          {workshopSchools.length > 0 ? (
            <div className="relative pt-10 sm:pt-12 md:pt-14 flex flex-col items-center">
              {partners.length > 0 ? (
                <div
                  className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-indigo-200/80 to-transparent"
                  aria-hidden
                />
              ) : null}
              <SubsectionIntro
                as="h3"
                align="center"
                title="Our Reach Across Schools"
                description="Schools where we have conducted seminars and hands-on workshops, bringing robotics education directly to students."
              />
              <SchoolReachGrid items={workshopSchools} />
            </div>
          ) : null}
        </HomeSection>
      )}
    </>
  )
}

