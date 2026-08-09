import Link from "next/link";
import Image from "next/image";
import type {
  RobofestCategoryContent,
  RobofestContent,
} from "@/lib/robofest-content";
import {
  getRobofestCategoryImage,
  getRobofestCategoryRulesPdf,
} from "@/lib/robofest-content";
import { getRobofestCategoryRules } from "@/lib/robofest-category-rules";
import RobofestCategoryRegistrationForm from "@/components/RobofestCategoryRegistrationForm";
import RobofestRegistrationCountdown from "@/components/RobofestRegistrationCountdown";
import { isRegistrationClosedByDate } from "@/lib/dateUtils";
import { Button } from "@/components/ui/button";
import RobofestIcon from "@/components/RobofestIcon";

function RulesViewButton({
  href,
  label = "View rules (PDF)",
  className = "",
}: {
  href: string;
  label?: string;
  className?: string;
}) {
  return (
    <Button
      asChild
      className={`bg-cyan-600 text-white hover:bg-cyan-700 font-semibold shadow-sm shadow-cyan-600/20 ${className}`}
    >
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5"
      >
        <RobofestIcon name="open_in_new" className="text-base" />
        {label}
      </a>
    </Button>
  );
}

export default function RobofestCategoryPage({
  category,
  content,
  fee,
  schools,
}: {
  category: RobofestCategoryContent;
  content: RobofestContent;
  fee: { isPaid: boolean; amount: number };
  schools: string[];
}) {
  const rulesPdf = getRobofestCategoryRulesPdf(category);
  const rules = getRobofestCategoryRules(category.slug);
  const heroImage = getRobofestCategoryImage(category);
  const showPdf = Boolean(rulesPdf);
  const contactEmail = content.contactEmail?.trim() || "";
  const registrationContact =
    content.contactLines?.find((line) =>
      /registrations?\s*related/i.test(line.note || ""),
    ) ||
    content.contactLines?.[1] ||
    content.contactLines?.[0];
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      <header className="relative isolate overflow-hidden text-white min-h-[18rem] sm:min-h-[20rem]">
        <Image
          src={heroImage}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div
          className="absolute inset-0 bg-linear-to-br from-slate-950/80 via-cyan-950/70 to-slate-900/60"
          aria-hidden
        />
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)
            `,
            backgroundSize: "32px 32px",
          }}
          aria-hidden
        />
        <div
          className="absolute -top-24 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-cyan-400/25 blur-3xl"
          aria-hidden
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14 md:py-16">
          <Link
            href="/robofest"
            prefetch={false}
            className="inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white mb-5 sm:mb-7 transition-colors"
          >
            <RobofestIcon name="arrow_back" className="text-base" />
            All competitions
          </Link>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/15 backdrop-blur-sm ring-1 ring-white/25 flex items-center justify-center shrink-0 shadow-lg">
              <RobofestIcon
                name={category.icon}
                className="text-2xl sm:text-3xl text-cyan-100"
              />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100/90 mb-2">
                Robofest Local Round · Bangladesh
              </p>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight drop-shadow-sm">
                {category.name}
              </h1>
              <p className="text-sm sm:text-base text-white/85 mt-3 max-w-2xl leading-relaxed">
                {category.description}
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                {category.skillLevel ? (
                  <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] sm:text-xs font-medium text-white backdrop-blur-sm">
                    {category.skillLevel}
                  </span>
                ) : null}
                {category.format ? (
                  <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] sm:text-xs font-medium text-white backdrop-blur-sm">
                    {category.format}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 py-8 sm:py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-5 gap-8 lg:gap-10 items-start">
          <div className="lg:col-span-3 space-y-8 sm:space-y-10">
            <section>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 tracking-tight">
                About this competition
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                {category.about}
              </p>
            </section>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3.5">
                <div className="flex items-center gap-2 text-cyan-700 mb-1">
                  <RobofestIcon name="signal_cellular_alt" className="text-xl" />
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Skill level
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-900">
                  {category.skillLevel}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3.5">
                <div className="flex items-center gap-2 text-cyan-700 mb-1">
                  <RobofestIcon name="sports_esports" className="text-xl" />
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Format
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-900">
                  {category.format}
                </p>
              </div>
            </div>

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 tracking-tight">
                What to expect
              </h2>
              <ul className="space-y-3">
                {category.highlights.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 w-6 h-6 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-100 flex items-center justify-center shrink-0">
                      <RobofestIcon name="check" className="text-base" />
                    </span>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {item}
                    </p>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white px-5 py-5 sm:px-6 sm:py-6">
              <h2 className="text-lg font-bold text-slate-900 mb-2 tracking-tight">
                Who should join
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                {category.whoShouldJoin}
              </p>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
                {(content.dateLines?.length
                  ? content.dateLines
                  : content.dateLabel
                    ? [content.dateLabel]
                    : []
                ).map((line) => (
                  <p key={line} className="flex items-center gap-1.5">
                    <RobofestIcon
                      name="calendar_month"
                      className="text-cyan-700"
                    />
                    {line}
                  </p>
                ))}
                {(content.venueLines?.length
                  ? content.venueLines
                  : content.venueLabel
                    ? [content.venueLabel]
                    : []
                ).map((line) => (
                  <p key={line} className="flex items-center gap-1.5">
                    <RobofestIcon name="location_on" className="text-cyan-700" />
                    {line}
                  </p>
                ))}
              </div>
            </section>

            {showPdf && rulesPdf ? (
              <section className="rounded-2xl border border-cyan-200 bg-cyan-50/70 p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                      Official rules
                    </h2>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                      {rules?.summary?.trim() ||
                        "Full competition rules, specs, and scoring are in the official PDF."}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">
                      On-page highlights only—open the PDF for complete details.
                    </p>
                  </div>
                  <RulesViewButton
                    href={rulesPdf}
                    label={`View ${category.name} rules`}
                    className="shrink-0"
                  />
                </div>
              </section>
            ) : null}
          </div>

          <div className="lg:col-span-2 lg:sticky lg:top-24">
            <div
              id="register"
              className="rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/60 overflow-hidden"
            >
              <div className="border-b border-slate-100 bg-linear-to-b from-cyan-50/80 to-white px-5 sm:px-6 py-4 sm:py-5">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Register for {category.name}
                </h2>
                <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm font-medium text-red-700 leading-relaxed marker:text-red-600">
                  {fee.isPaid ? (
                    <li>
                      Registration fee: BDT {fee.amount} per member (e.g. 3
                      members = BDT {fee.amount * 3}). Pay via bKash to confirm.
                      After payment, do not close or leave the page until you
                      see the registration successful message.
                    </li>
                  ) : (
                    <li>Enter team details for the local round.</li>
                  )}
                  <li>
                    After you complete registration and payment, you will
                    receive a confirmation email with your registration PDF.
                  </li>
                  <li>Bring this PDF for entry at the event.</li>
                  <li>
                    If you registered and paid but did not receive the email or
                    PDF, check your junk/spam folder. If it is still missing,
                    contact us
                    {contactEmail ? (
                      <>
                        {" "}
                        at{" "}
                        <a
                          href={`mailto:${contactEmail}`}
                          className="font-semibold text-red-800 underline underline-offset-2 hover:text-red-900"
                        >
                          {contactEmail}
                        </a>
                      </>
                    ) : null}
                    {registrationContact?.phone ? (
                      <>
                        {contactEmail ? " or " : " at "}
                        <a
                          href={`tel:${registrationContact.phone.replace(/\s/g, "")}`}
                          className="font-semibold text-red-800 underline underline-offset-2 hover:text-red-900"
                        >
                          {registrationContact.phone}
                        </a>
                        {registrationContact.note
                          ? ` (${registrationContact.note})`
                          : null}
                      </>
                    ) : null}
                    .
                  </li>
                </ul>
                {content.registrationClosingDate ? (
                  <RobofestRegistrationCountdown
                    closingDate={content.registrationClosingDate}
                    className="mt-3"
                    compact
                  />
                ) : null}
              </div>
              <div className="px-5 sm:px-6 py-5">
                <RobofestCategoryRegistrationForm
                  category={category.name}
                  rounds={content.rounds}
                  schools={schools}
                  isPaid={fee.isPaid}
                  amount={fee.amount}
                  rulesPdf={rulesPdf || undefined}
                  registrationClosed={isRegistrationClosedByDate(
                    content.registrationClosingDate ?? undefined,
                  )}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
