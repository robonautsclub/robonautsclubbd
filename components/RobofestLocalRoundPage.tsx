import {
  getActiveRobofestCategories,
  getRobofestCategoryHref,
  getRobofestCategoryImage,
  getRobofestContent,
} from "@/lib/robofest-content";
import { SITE_CONFIG } from "@/lib/site-config";
import { Button } from "@/components/ui/button";
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

function venueIsTba(venueLabel: string): boolean {
  return /tba|to be announced/i.test(venueLabel);
}

function CircuitBackdrop({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 ${className}`} aria-hidden>
      <div
        className="absolute inset-0 opacity-[0.45]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(14,116,144,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(14,116,144,0.06) 1px, transparent 1px)
          `,
          backgroundSize: "28px 28px",
        }}
      />
      <div className="absolute -top-24 left-1/2 h-80 w-[36rem] -translate-x-1/2 rounded-full bg-cyan-200/40 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-sky-200/35 blur-3xl" />
      <div className="absolute top-1/3 -left-16 h-56 w-56 rounded-full bg-indigo-200/25 blur-3xl" />
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center mb-10 sm:mb-14">
      <p className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-800 mb-4">
        <MaterialIcon name="smart_toy" className="text-sm" />
        {eyebrow}
      </p>
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3 text-slate-900">
        {title}
      </h2>
      <p className="max-w-2xl mx-auto text-sm sm:text-base leading-relaxed text-slate-600">
        {description}
      </p>
    </div>
  );
}

export default async function RobofestLocalRoundPage() {
  const content = await getRobofestContent();
  const categories = getActiveRobofestCategories(content);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <section className="relative overflow-hidden px-4 sm:px-6 pt-16 sm:pt-20 md:pt-24 pb-14 sm:pb-20">
        <div className="absolute inset-0 bg-linear-to-b from-sky-100 via-cyan-50 to-slate-50" aria-hidden />
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage: `
              linear-gradient(rgba(8,145,178,0.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(8,145,178,0.08) 1px, transparent 1px)
            `,
            backgroundSize: "36px 36px",
            maskImage:
              "radial-gradient(ellipse 80% 70% at 50% 30%, black 15%, transparent 75%)",
          }}
          aria-hidden
        />
        <div
          className="absolute -top-32 left-1/2 h-[28rem] w-[42rem] -translate-x-1/2 rounded-full bg-cyan-300/35 blur-3xl"
          aria-hidden
        />
        <div
          className="absolute top-24 -left-24 h-72 w-72 rounded-full bg-sky-300/30 blur-3xl"
          aria-hidden
        />
        <div
          className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-teal-200/40 blur-3xl"
          aria-hidden
        />
        <div
          className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-slate-50 to-transparent"
          aria-hidden
        />

        <div className="relative z-10 max-w-7xl mx-auto text-center animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-cyan-200/80 bg-white/70 backdrop-blur-md shadow-sm mb-5 sm:mb-7">
            <MaterialIcon
              name="precision_manufacturing"
              className="text-base sm:text-lg text-cyan-700"
            />
            <span className="text-xs sm:text-sm font-medium text-slate-700 tracking-wide">
              {content.statusBadge}
            </span>
          </div>

          <p className="text-sm sm:text-base md:text-lg font-bold uppercase tracking-[0.28em] text-cyan-700 mb-3">
            {SITE_CONFIG.name}
          </p>

          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-5 sm:mb-6 tracking-tight px-2 text-slate-900">
            {content.headline}
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed px-2 mb-8 sm:mb-10">
            {content.lead}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-2">
            <Button
              asChild
              size="lg"
              className="bg-cyan-600 text-white hover:bg-cyan-700 shadow-md shadow-cyan-600/20 w-full sm:w-auto font-semibold"
            >
              <a href="#categories" className="inline-flex items-center gap-1.5">
                Enter a category
                <MaterialIcon name="arrow_forward" className="text-lg" />
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-slate-300 bg-white/80 text-slate-800 hover:bg-white hover:text-slate-900 w-full sm:w-auto backdrop-blur-sm"
            >
              <Link href={content.contactHref}>Contact &amp; info</Link>
            </Button>
          </div>
        </div>
      </section>

      <main className="flex-1 relative">
        <section className="relative py-14 sm:py-20 px-4 sm:px-6 overflow-hidden bg-slate-50">
          <CircuitBackdrop />
          <div className="relative max-w-7xl mx-auto">
            <SectionHeading
              eyebrow="Mission timeline"
              title="Round schedule"
              description="Two Bangladesh launch sites—pick your city, build your robot, and race toward the world stage."
            />

            <div className="grid md:grid-cols-2 gap-5 sm:gap-6">
              {content.rounds.map((round, index) => (
                <article
                  key={round.city}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-500 hover:-translate-y-1 hover:border-cyan-300 hover:shadow-lg"
                >
                  <div className="relative aspect-video overflow-hidden bg-slate-200">
                    <Image
                      src={round.image}
                      alt=""
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-slate-900/70 via-slate-900/20 to-transparent" />
                    <div className="absolute top-3 left-3">
                      <span className="rounded-md border border-white/30 bg-black/40 px-2 py-1 font-mono text-[11px] text-cyan-100 backdrop-blur-sm">
                        NODE-{String(index + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <span className="absolute bottom-3 left-3 rounded-full bg-white px-3 py-1 text-xs font-semibold tracking-wide text-cyan-800 uppercase shadow-sm">
                      {round.city}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-700 mb-2">
                      {round.city} operations
                    </p>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-snug mb-3">
                      {round.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed mb-5">
                      Deploy your autonomous robot in {round.city}. Local-round
                      wins feed the path to the Robofest World Championship.
                    </p>

                    <ul className="space-y-3.5 flex-1">
                      {(
                        [
                          {
                            icon: "calendar_month",
                            label: "Dates",
                            value: round.dates,
                          },
                          {
                            icon: "location_on",
                            label: "Venue",
                            value: round.venueLabel,
                            detail: venueIsTba(round.venueLabel)
                              ? "Exact venue locks in before competition day"
                              : undefined,
                          },
                          {
                            icon: "apartment",
                            label: "Host",
                            value: content.hostName,
                          },
                        ] as const
                      ).map((row) => (
                        <li key={row.label} className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-lg border border-cyan-100 bg-cyan-50 text-cyan-700 flex items-center justify-center shrink-0">
                            <MaterialIcon name={row.icon} className="text-xl" />
                          </div>
                          <div>
                            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                              {row.label}
                            </p>
                            <p className="text-sm font-semibold text-slate-900">
                              {row.value}
                            </p>
                            {"detail" in row && row.detail ? (
                              <p className="text-xs text-slate-500 mt-0.5">
                                {row.detail}
                              </p>
                            ) : null}
                          </div>
                        </li>
                      ))}
                      <li className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg border border-cyan-100 bg-cyan-50 text-cyan-700 flex items-center justify-center shrink-0">
                          <MaterialIcon name="call" className="text-xl" />
                        </div>
                        <div>
                          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                            Contact
                          </p>
                          <Link
                            href={content.contactHref}
                            className="text-sm font-semibold text-cyan-700 hover:text-cyan-800"
                          >
                            About · Contact
                          </Link>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Info &amp; registration help
                          </p>
                        </div>
                      </li>
                    </ul>

                    <div className="mt-6">
                      <Button
                        asChild
                        className="w-full bg-cyan-600 text-white hover:bg-cyan-700 font-semibold"
                      >
                        <a
                          href="#categories"
                          className="inline-flex items-center gap-1.5"
                        >
                          Browse categories &amp; register
                          <MaterialIcon name="arrow_forward" className="text-base" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="relative py-14 sm:py-20 px-4 sm:px-6 overflow-hidden border-y border-slate-200 bg-white">
          <CircuitBackdrop className="opacity-60" />
          <div className="relative max-w-7xl mx-auto">
            <SectionHeading
              eyebrow="Protocol"
              title="How the local round works"
              description="Official Robofest by Lawrence Technological University—build autonomous systems here in Bangladesh, then aim for the world championship."
            />

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {content.howItWorks.map((step, index) => (
                <div
                  key={step.title}
                  className="group relative rounded-2xl border border-slate-200 bg-slate-50/80 p-5 sm:p-6 transition-all duration-300 hover:border-cyan-300 hover:bg-cyan-50/50 hover:shadow-md"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="font-mono text-xs font-bold text-cyan-700/80">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="w-11 h-11 rounded-xl border border-cyan-100 bg-white text-cyan-700 flex items-center justify-center shadow-sm transition-transform duration-300 group-hover:scale-110">
                      <MaterialIcon name={step.icon} />
                    </div>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="categories"
          className="scroll-mt-24 relative overflow-hidden py-14 sm:py-20 px-4 sm:px-6 bg-slate-50"
        >
          <CircuitBackdrop />
          <div className="relative max-w-7xl mx-auto">
            <SectionHeading
              eyebrow="Choose your arena"
              title="Competition categories"
              description="Four competition tracks—lock in the challenge that fits your team, then register for Dhaka or Chittagong."
            />

            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5 sm:gap-6">
              {categories.map((category, index) => {
                const cover = getRobofestCategoryImage(category);
                return (
                  <Link
                    key={category.slug}
                    href={getRobofestCategoryHref(category.slug)}
                    className="group block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
                  >
                    <article className="relative h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-500 group-hover:-translate-y-1.5 group-hover:border-cyan-300 group-hover:shadow-xl">
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <Image
                          src={cover}
                          alt=""
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-slate-900/80 via-slate-900/25 to-transparent" />
                        <div className="absolute top-3 left-3 flex items-center gap-2">
                          <span className="rounded-md border border-white/25 bg-black/40 px-2.5 py-1 font-mono text-[11px] font-semibold tracking-wide text-white backdrop-blur-sm">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white backdrop-blur-sm shadow-lg">
                            <MaterialIcon
                              name={category.icon}
                              className="text-xl"
                            />
                          </span>
                        </div>
                        <div className="absolute bottom-3 left-3 right-3">
                          <h3 className="text-xl font-bold text-white tracking-tight drop-shadow-sm">
                            {category.name}
                          </h3>
                        </div>
                      </div>

                      <div className="flex flex-col p-5 pt-4">
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-0.5 text-[11px] font-medium text-cyan-800">
                            {category.skillLevel}
                          </span>
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-700">
                            {category.format}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed flex-1">
                          {category.description}
                        </p>
                        <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan-700 transition-colors group-hover:text-cyan-800">
                          View &amp; register
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-cyan-100 transition-transform duration-300 group-hover:translate-x-1">
                            <MaterialIcon
                              name="arrow_forward"
                              className="text-base"
                            />
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="relative py-14 sm:py-20 px-4 sm:px-6 overflow-hidden border-t border-slate-200 bg-white">
          <CircuitBackdrop className="opacity-50" />
          <div className="relative max-w-3xl mx-auto text-center rounded-3xl border border-cyan-200 bg-linear-to-b from-cyan-50 to-white px-6 py-10 sm:px-10 sm:py-12 shadow-sm">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-200 bg-white text-cyan-700 shadow-sm">
              <MaterialIcon name="rocket_launch" className="text-3xl" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 tracking-tight">
              Ready to compete?
            </h2>
            <p className="text-slate-600 mb-7 text-sm sm:text-base leading-relaxed">
              Pick a category, register your team, and bring an autonomous robot
              built by students—to Dhaka or Chittagong.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                asChild
                className="bg-cyan-600 text-white hover:bg-cyan-700 font-semibold"
              >
                <a href="#categories">Choose category</a>
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
