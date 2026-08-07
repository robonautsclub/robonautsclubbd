import {
  getActiveRobofestCategories,
  getRobofestContent,
  getRobofestCategoryHref,
  type RobofestContent,
} from "@/lib/robofest-content";
import type { RobofestEventFact } from "@/lib/robofest-local";
import { SITE_CONFIG } from "@/lib/site-config";
import ListingHeroSection from "@/components/ListingHeroSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";

function MaterialIcon({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  return (
    <span className={`material-symbols-outlined ${className}`} aria-hidden>
      {name}
    </span>
  );
}

function buildEventFacts(content: RobofestContent): RobofestEventFact[] {
  return [
    {
      icon: "calendar_month",
      label: "Date",
      value: content.dateLabel,
    },
    {
      icon: "location_on",
      label: "Venue",
      value: content.venueLabel,
      detail: content.venueDetail,
    },
    {
      icon: "apartment",
      label: "Host",
      value: content.hostName,
    },
    {
      icon: "call",
      label: "Contact",
      value: "About · Contact",
      detail: "Info & registration help",
      href: content.contactHref,
    },
  ];
}

export default async function RobofestLocalRoundPage() {
  const content = await getRobofestContent();
  const categories = getActiveRobofestCategories(content);
  const eventFacts = buildEventFacts(content);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ListingHeroSection overlay="dark">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-300 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-300 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="max-w-7xl mx-auto relative text-center animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/10 backdrop-blur-sm mb-4 sm:mb-6">
            <MaterialIcon name="rocket_launch" className="text-base sm:text-lg text-cyan-200" />
            <span className="text-xs sm:text-sm font-medium">
              {content.statusBadge}
            </span>
          </div>

          <p className="text-sm sm:text-base font-semibold tracking-wide text-cyan-200 mb-2 sm:mb-3">
            {SITE_CONFIG.name}
          </p>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 sm:mb-6 tracking-tight px-2">
            {content.headline}
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed px-2 mb-6 sm:mb-8">
            {content.lead}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-2">
            <Button
              asChild
              size="lg"
              className="bg-indigo-500 text-white hover:bg-indigo-600 shadow-md hover:shadow-lg w-full sm:w-auto"
            >
              <a
                href={SITE_CONFIG.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1"
              >
                Follow for registration
                <MaterialIcon name="arrow_forward" className="text-lg" />
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white w-full sm:w-auto"
            >
              <Link href={content.contactHref}>Contact &amp; info</Link>
            </Button>
          </div>
        </div>
      </ListingHeroSection>

      <main className="flex-1">
        <section className="relative -mt-6 sm:-mt-8 z-10 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
              {eventFacts.map((fact) => (
                <div
                  key={fact.label}
                  className="flex items-start gap-3 p-4 sm:p-5"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-500 flex items-center justify-center shrink-0">
                    <MaterialIcon name={fact.icon} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      {fact.label}
                    </p>
                    {fact.href ? (
                      <Link
                        href={fact.href}
                        className="text-sm sm:text-base font-semibold text-gray-900 hover:text-indigo-600"
                      >
                        {fact.value}
                      </Link>
                    ) : (
                      <p className="text-sm sm:text-base font-semibold text-gray-900">
                        {fact.value}
                      </p>
                    )}
                    {fact.detail ? (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {fact.detail}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                Round schedule
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base">
                Two Bangladesh rounds—pick the city that works for your team.
                Exact venues will be announced soon.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-5 sm:gap-6">
              {content.rounds.map((round) => (
                <article
                  key={round.city}
                  className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow duration-300"
                >
                  <div className="relative aspect-video bg-linear-to-br from-indigo-100 via-blue-50 to-cyan-100">
                    <Image
                      src={round.image}
                      alt=""
                      fill
                      className="object-cover opacity-90"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-gray-900/55 via-gray-900/15 to-transparent" />
                    <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-indigo-700">
                      {round.city}
                    </span>
                  </div>
                  <div className="p-5 sm:p-6">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight mb-4 leading-snug">
                      {round.title}
                    </h3>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                          <MaterialIcon name="calendar_month" className="text-xl" />
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Dates
                          </p>
                          <p className="text-sm font-semibold text-gray-900">
                            {round.dates}
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                          <MaterialIcon name="location_on" className="text-xl" />
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Venue
                          </p>
                          <p className="text-sm font-semibold text-gray-900">
                            {round.venueLabel}
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                          <MaterialIcon name="apartment" className="text-xl" />
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Host
                          </p>
                          <p className="text-sm font-semibold text-gray-900">
                            {content.hostName}
                          </p>
                        </div>
                      </li>
                    </ul>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                How the local round works
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base">
                Official Robofest by Lawrence Technological University—compete
                here in Bangladesh, then chase a spot on the world stage.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {content.howItWorks.map((step, index) => (
                <Card
                  key={step.title}
                  className="border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-300 group"
                >
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xs font-bold text-indigo-400">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-100 to-blue-100 text-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <MaterialIcon name={step.icon} />
                      </div>
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                      {step.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 sm:py-16 bg-linear-to-br from-indigo-50/80 via-blue-50/60 to-cyan-50/40 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                Competition categories
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base mb-4">
                Register for the local-round category that matches your skill
                and ambition.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  href={getRobofestCategoryHref(category.slug)}
                  className="group block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                >
                  <Card className="h-full bg-white/90 border border-white shadow-sm group-hover:shadow-md group-hover:border-indigo-200 transition-all duration-300">
                    <CardContent className="p-5 flex flex-col h-full">
                      <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                        <MaterialIcon name={category.icon} />
                      </div>
                      <h3 className="text-base font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed flex-1">
                        {category.description}
                      </p>
                      <p className="mt-3 text-xs font-medium text-indigo-500 inline-flex items-center gap-1">
                        View &amp; register
                        <MaterialIcon name="arrow_forward" className="text-sm" />
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 sm:py-16 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              Ready to compete?
            </h2>
            <p className="text-gray-600 mb-6 text-sm sm:text-base">
              Pick a category above to register for the Bangladesh local round,
              or reach out if you have questions.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild className="bg-indigo-500 hover:bg-indigo-600 text-white">
                <Link href={content.contactHref}>Contact us</Link>
              </Button>
              <Button asChild variant="outline">
                <a
                  href={content.officialSite}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Official Robofest site
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
