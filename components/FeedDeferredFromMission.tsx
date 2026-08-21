'use client'

import FAQSection from './FAQSection'
import { HomeSection } from './home-section'
import OlympiadShowcase from './OlympiadShowcase'
import PartnerShowcase from './PartnerShowcase'
import SchoolReachShowcase from './SchoolReachShowcase'

export type FeedFaqItem = { question: string; answer: string }

type NamedLogo = { name: string; logo?: string }

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
      <HomeSection tone="ink" showOrbs bottomWave className="pt-20 sm:pt-24">
        <OlympiadShowcase />
      </HomeSection>

      <HomeSection tone="white">
        <FAQSection items={faqItems} />
      </HomeSection>

      {(partners.length > 0 || workshopSchools.length > 0) && (
        <HomeSection
          tone="wash"
          showOrbs
          containerClassName="space-y-16 sm:space-y-20 md:space-y-24"
        >
          {partners.length > 0 ? <PartnerShowcase items={partners} /> : null}

          {workshopSchools.length > 0 ? (
            <div className="relative pt-4 sm:pt-6">
              {partners.length > 0 ? (
                <div
                  className="absolute top-0 right-0 left-0 h-px bg-linear-to-r from-transparent via-indigo-200/80 to-transparent"
                  aria-hidden
                />
              ) : null}
              <SchoolReachShowcase items={workshopSchools} />
            </div>
          ) : null}
        </HomeSection>
      )}
    </>
  )
}
