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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

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

function RulesDownloadButton({
  href,
  filename,
  label = "Download rules (PDF)",
}: {
  href: string;
  filename: string;
  label?: string;
}) {
  return (
    <Button asChild>
      <a
        href={href}
        download={filename}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5"
      >
        <MaterialIcon name="download" className="text-base" />
        {label}
      </a>
    </Button>
  );
}

function OfficialRulesCta({
  pdfHref,
  filename,
  categoryName,
  summary,
}: {
  pdfHref: string;
  filename: string;
  categoryName: string;
  summary?: string;
}) {
  return (
    <section className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            Official rules
          </h2>
          <p className="text-sm text-gray-600 mt-1 leading-relaxed">
            {summary?.trim() ||
              "Full competition rules, specs, and scoring are in the official PDF."}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            On-page highlights only—download the PDF for complete details.
          </p>
        </div>
        <RulesDownloadButton
          href={pdfHref}
          filename={filename}
          label={`Download ${categoryName} rules (PDF)`}
        />
      </div>
    </section>
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
  const downloadFilename =
    rules?.downloadFilename ?? `${category.slug}-rules.pdf`;
  const showPdf = Boolean(rulesPdf);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="relative isolate overflow-hidden text-white">
        <Image
          src={heroImage}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div
          className="absolute inset-0 bg-linear-to-br from-indigo-950/85 via-blue-900/75 to-cyan-900/65"
          aria-hidden
        />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)
            `,
            backgroundSize: "28px 28px",
          }}
          aria-hidden
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14 md:py-16">
          <Link
            href="/robofest"
            className="inline-flex items-center gap-1 text-sm text-white/80 hover:text-white mb-5 sm:mb-7 transition-colors"
          >
            <MaterialIcon name="arrow_back" className="text-base" />
            All categories
          </Link>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20 flex items-center justify-center shrink-0">
              <MaterialIcon
                name={category.icon}
                className="text-2xl sm:text-3xl text-cyan-100"
              />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-cyan-100/90 mb-1">
                Robofest Local Round · Bangladesh
              </p>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight drop-shadow-sm">
                {category.name}
              </h1>
              <p className="text-sm sm:text-base text-white/85 mt-2 max-w-2xl leading-relaxed">
                {category.description}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 py-8 sm:py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-5 gap-8 lg:gap-10 items-start">
          <div className="lg:col-span-3 space-y-6 sm:space-y-8">
            <section>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">
                About this category
              </h2>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                {category.about}
              </p>
            </section>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-indigo-500 mb-1.5">
                  <MaterialIcon name="signal_cellular_alt" className="text-xl" />
                  <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Skill level
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  {category.skillLevel}
                </p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-indigo-500 mb-1.5">
                  <MaterialIcon name="sports_esports" className="text-xl" />
                  <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Format
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  {category.format}
                </p>
              </div>
            </div>

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">
                What to expect
              </h2>
              <ul className="space-y-3">
                {category.highlights.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 w-6 h-6 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                      <MaterialIcon name="check" className="text-base" />
                    </span>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {item}
                    </p>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                Who should join
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                {category.whoShouldJoin}
              </p>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
                <p className="flex items-center gap-1.5">
                  <MaterialIcon name="calendar_month" className="text-indigo-500" />
                  {content.dateLabel}
                </p>
                <p className="flex items-center gap-1.5">
                  <MaterialIcon name="location_on" className="text-indigo-500" />
                  {content.venueLabel}
                </p>
              </div>
            </section>

            {showPdf && rulesPdf ? (
              <OfficialRulesCta
                pdfHref={rulesPdf}
                filename={downloadFilename}
                categoryName={category.name}
                summary={rules?.summary}
              />
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline">
                <Link href="/robofest">Back to Robofest</Link>
              </Button>
              {showPdf && rulesPdf ? (
                <RulesDownloadButton
                  href={rulesPdf}
                  filename={downloadFilename}
                  label={`Download ${category.name} rules (PDF)`}
                />
              ) : null}
              <Button asChild variant="outline">
                <a
                  href={content.categoriesUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1"
                >
                  Global Robofest overview
                  <MaterialIcon name="open_in_new" className="text-base" />
                </a>
              </Button>
            </div>
          </div>

          <div className="lg:col-span-2 lg:sticky lg:top-24">
            <Card className="border border-gray-100 shadow-md">
              <CardHeader className="pb-2">
                <h2 className="text-lg font-bold text-gray-900">
                  Register for {category.name}
                </h2>
                <p className="text-sm text-gray-500">
                  {fee.isPaid
                    ? `Registration fee: BDT ${fee.amount}. You will be redirected to bKash to pay.`
                    : "Enter team details for the local round. Confirmation will be emailed after submit."}
                </p>
              </CardHeader>
              <CardContent>
                <RobofestCategoryRegistrationForm
                  category={category.name}
                  rounds={content.rounds}
                  schools={schools}
                  isPaid={fee.isPaid}
                  amount={fee.amount}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
