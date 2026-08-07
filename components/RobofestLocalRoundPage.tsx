import {
  getActiveRobofestCategories,
  getRobofestCategoryHref,
  getRobofestCategoryImage,
  getRobofestCategoryRulesPdf,
  getRobofestContent,
} from "@/lib/robofest-content";
import { ROBOFEST_HOW_IT_WORKS, ROBOFEST_LOCAL } from "@/lib/robofest-local";
import { Button } from "@/components/ui/button";
import { Instagram } from "lucide-react";
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

          <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.28em] text-cyan-700 mb-3">
            {ROBOFEST_LOCAL.presentsLabel}
          </p>

          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-5 sm:mb-6 tracking-tight px-2 text-slate-900">
            {ROBOFEST_LOCAL.headline}
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed px-2">
            {ROBOFEST_LOCAL.lead}
          </p>
        </div>
      </section>

      <section className="relative z-10 px-4 sm:px-6 -mt-6 sm:-mt-8 mb-2">
        <div className="max-w-7xl mx-auto rounded-2xl border border-slate-200/80 bg-white shadow-lg shadow-slate-200/50 overflow-hidden">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            <div className="p-4 sm:p-5 text-left">
              <div className="flex items-center gap-2 text-cyan-700 mb-2">
                <MaterialIcon name="calendar_month" className="text-xl" />
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Date
                </span>
              </div>
              <ul className="space-y-1">
                {ROBOFEST_LOCAL.dateLines.map((line) => (
                  <li key={line} className="text-sm font-semibold text-slate-900">
                    {line}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 sm:p-5 text-left">
              <div className="flex items-center gap-2 text-cyan-700 mb-2">
                <MaterialIcon name="location_on" className="text-xl" />
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Venue
                </span>
              </div>
              <ul className="space-y-1">
                {ROBOFEST_LOCAL.venueLines.map((line) => (
                  <li key={line} className="text-sm font-semibold text-slate-900">
                    {line}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 sm:p-5 text-left">
              <div className="flex items-center gap-2 text-cyan-700 mb-2">
                <MaterialIcon name="apartment" className="text-xl" />
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Host
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-900">
                {content.hostName || ROBOFEST_LOCAL.hostName}
              </p>
            </div>

            <div className="p-4 sm:p-5 text-left">
              <div className="flex items-center gap-2 text-cyan-700 mb-2">
                <MaterialIcon name="call" className="text-xl" />
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Contact
                </span>
              </div>
              <p className="text-sm text-slate-800 mb-2">
                <span className="font-medium text-slate-500">E-Mail:</span>{" "}
                <a
                  href={`mailto:${ROBOFEST_LOCAL.contactEmail}`}
                  className="font-semibold text-cyan-700 hover:text-cyan-800 break-all"
                >
                  {ROBOFEST_LOCAL.contactEmail}
                </a>
              </p>
              <ul className="space-y-2">
                {ROBOFEST_LOCAL.contactLines.map((line) => (
                  <li key={line.phone} className="text-sm text-slate-800">
                    <span className="font-semibold text-slate-900">
                      {line.label}:
                    </span>{" "}
                    <a
                      href={`tel:${line.phone.replace(/\s/g, "")}`}
                      className="font-semibold text-cyan-700 hover:text-cyan-800"
                    >
                      {line.phone}
                    </a>
                    <span className="block text-xs text-slate-500">
                      ({line.note})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1 relative">
        <section className="relative py-14 sm:py-20 px-4 sm:px-6 overflow-hidden border-y border-slate-200 bg-white">
          <CircuitBackdrop className="opacity-60" />
          <div className="relative max-w-7xl mx-auto">
            <SectionHeading
              eyebrow="Protocol"
              title="How the Local Round Works"
              description="Compete in RoboFest Bangladesh 2026 through Robotics, Programming & Innovation Challenges with Top Performers getting closer to the World Stage."
            />

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {ROBOFEST_HOW_IT_WORKS.map((step, index) => (
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
              title="Competition Categories"
              description="Choose Your Challenge. Build, Code, Innovate & Compete at RoboFest Bangladesh 2026."
            />

            <div className="flex justify-center mb-8 sm:mb-10">
              <Button
                asChild
                size="lg"
                className="bg-cyan-600 text-white hover:bg-cyan-700 font-semibold shadow-md shadow-cyan-600/20 px-6 sm:px-8"
              >
                <a
                  href={ROBOFEST_LOCAL.generalRulesPdf}
                  download="General-Rules-and-Regulations.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  <MaterialIcon name="download" className="text-xl" />
                  General Rules &amp; Regulations
                </a>
              </Button>
            </div>

            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5 sm:gap-6">
              {categories.map((category, index) => {
                const cover = getRobofestCategoryImage(category);
                const rulesPdf = getRobofestCategoryRulesPdf(category);
                return (
                  <article
                    key={category.slug}
                    className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-500 hover:-translate-y-1.5 hover:border-cyan-300 hover:shadow-xl"
                  >
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

                    <div className="flex flex-1 flex-col p-5 pt-4">
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
                      <div className="mt-5 space-y-2">
                        {rulesPdf ? (
                          <Button
                            asChild
                            variant="outline"
                            className="w-full border-cyan-200 text-cyan-800 hover:bg-cyan-50"
                          >
                            <a
                              href={rulesPdf}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-1.5"
                            >
                              <MaterialIcon name="download" className="text-base" />
                              Download rulebook
                            </a>
                          </Button>
                        ) : null}
                        <Button
                          asChild
                          className="w-full bg-cyan-600 text-white hover:bg-cyan-700 font-semibold"
                        >
                          <Link
                            href={getRobofestCategoryHref(category.slug)}
                            className="inline-flex items-center justify-center gap-1.5"
                          >
                            View &amp; register
                            <MaterialIcon name="arrow_forward" className="text-base" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </article>
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
              Ready for the Local Round?
            </h2>
            <div className="text-slate-600 mb-7 text-sm sm:text-base leading-relaxed space-y-2">
              <p>
                RoboFest Bangladesh 2026 is coming to{" "}
                <span className="font-semibold text-slate-800">
                  Chittagong &amp; Dhaka
                </span>{" "}
                this <span className="font-semibold text-slate-800">September.</span>
              </p>
              <p>Choose Your Competition, Form Your Team, and Get Ready to Compete.</p>
              <p className="font-semibold text-slate-900">
                Chittagong - 11 September | Dhaka - 18 September
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center flex-wrap">
              <Button
                asChild
                className="bg-cyan-600 text-white hover:bg-cyan-700 font-semibold"
              >
                <a href="#categories">Register Now</a>
              </Button>
              <Button asChild variant="outline">
                <Link href={content.contactHref || ROBOFEST_LOCAL.contactHref}>
                  Contact
                </Link>
              </Button>
              <Button asChild variant="outline">
                <a
                  href={ROBOFEST_LOCAL.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                  aria-label="Robonauts Ltd on Instagram"
                >
                  <Instagram className="h-4 w-4" aria-hidden />
                  Instagram
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
