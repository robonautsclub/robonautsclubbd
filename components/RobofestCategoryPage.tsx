import Link from "next/link";
import type {
  RobofestCategoryContent,
  RobofestContent,
} from "@/lib/robofest-content";
import { BOTTLESUMO_RULES } from "@/lib/robofest-bottlesumo-rules";
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
  label = "Download rules (PDF)",
}: {
  href: string;
  label?: string;
}) {
  return (
    <Button asChild>
      <a
        href={href}
        download="BottleSumo-Competition-Rules.pdf"
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

function BottleSumoRulesSection({ pdfHref }: { pdfHref: string }) {
  const rules = BOTTLESUMO_RULES;

  return (
    <section className="space-y-8 rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-indigo-500 mb-1">
            Ref: {rules.ref} · Date: {rules.date}
          </p>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            Rules &amp; guidelines
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Local-round framework for BottleSumo. Download the full PDF for the
            complete document.
          </p>
        </div>
        <RulesDownloadButton href={pdfHref} />
      </div>

      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-3">
          Competition rounds
        </h3>
        <ul className="space-y-3">
          {rules.rounds.map((round) => (
            <li key={round.name} className="text-sm text-gray-600 leading-relaxed">
              <span className="font-semibold text-gray-900">{round.name}:</span>{" "}
              {round.purpose}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-3">
          Key definitions
        </h3>
        <dl className="space-y-3">
          {rules.definitions.map((item) => (
            <div key={item.term}>
              <dt className="text-sm font-semibold text-gray-900">{item.term}</dt>
              <dd className="text-sm text-gray-600 leading-relaxed mt-0.5">
                {item.meaning}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-3">
          General robot rules
        </h3>
        <ul className="space-y-2">
          {rules.generalRules.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2 text-sm text-gray-600 leading-relaxed"
            >
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-3">
          Category specifications
        </h3>
        <div className="overflow-x-auto -mx-1 px-1">
          <table className="w-full min-w-md text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                {rules.specs.columns.map((col) => (
                  <th
                    key={col}
                    className="py-2 pr-3 font-semibold text-gray-900 whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rules.specs.rows.map((row) => (
                <tr key={row[0]} className="border-b border-gray-100 align-top">
                  <td className="py-2.5 pr-3 font-medium text-gray-800">
                    {row[0]}
                  </td>
                  <td className="py-2.5 pr-3 text-gray-600">{row[1]}</td>
                  <td className="py-2.5 text-gray-600">{row[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="mt-4 space-y-2">
          {rules.sensorMotorNotes.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2 text-sm text-gray-600 leading-relaxed"
            >
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <RuleBulletBlock title="Playing field" items={rules.field} />
      <RuleBulletBlock title="Bottles (time trial)" items={rules.bottles} />
      <RuleBulletBlock title="Robot start task" items={rules.startTask} />
      <RuleBulletBlock
        title="Competition day procedures"
        items={rules.competitionDay}
      />
      <RuleBulletBlock title="Time trial round" items={rules.timeTrial} />
      <RuleBulletBlock
        title="Head-to-head games"
        items={rules.headToHead}
      />
      <RuleBulletBlock
        title="Winning a game"
        items={rules.winConditions}
      />
      <RuleBulletBlock title="Ties & tiebreakers" items={rules.ties} />

      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-3">FAQ</h3>
        <ul className="space-y-4">
          {rules.faq.map((item) => (
            <li key={item.q}>
              <p className="text-sm font-semibold text-gray-900">{item.q}</p>
              <p className="text-sm text-gray-600 leading-relaxed mt-1">
                {item.a}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Contact</h3>
        <p className="text-sm text-gray-600">
          {rules.contact.name}
          <br />
          {rules.contact.role}
        </p>
        <p className="text-sm text-gray-600 mt-2">
          <a
            href={`mailto:${rules.contact.email}`}
            className="text-indigo-600 hover:underline"
          >
            {rules.contact.email}
          </a>
          <span className="mx-2 text-gray-300">·</span>
          <a
            href={`tel:${rules.contact.phone.replace(/\s/g, "")}`}
            className="text-indigo-600 hover:underline"
          >
            {rules.contact.phone}
          </a>
        </p>
      </div>

      <div className="pt-1">
        <RulesDownloadButton
          href={pdfHref}
          label="Download BottleSumo rules (PDF)"
        />
      </div>
    </section>
  );
}

function RuleBulletBlock({
  title,
  items,
}: {
  title: string;
  items: readonly string[];
}) {
  return (
    <div>
      <h3 className="text-base font-semibold text-gray-900 mb-3">{title}</h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item}
            className="flex items-start gap-2 text-sm text-gray-600 leading-relaxed"
          >
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function RobofestCategoryPage({
  category,
  content,
  fee,
}: {
  category: RobofestCategoryContent;
  content: RobofestContent;
  fee: { isPaid: boolean; amount: number };
}) {
  const rulesPdf = category.rulesPdf;
  const showBottleSumoRules = category.slug === "bottlesumo" && Boolean(rulesPdf);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-linear-to-br from-indigo-600 via-blue-600 to-cyan-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <Link
            href="/robofest"
            className="inline-flex items-center gap-1 text-sm text-indigo-100 hover:text-white mb-4 sm:mb-6"
          >
            <MaterialIcon name="arrow_back" className="text-base" />
            All categories
          </Link>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <MaterialIcon
                name={category.icon}
                className="text-2xl sm:text-3xl text-cyan-100"
              />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-indigo-100 mb-1">
                Robofest Local Round · Bangladesh
              </p>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
                {category.name}
              </h1>
              <p className="text-sm sm:text-base text-blue-100 mt-2 max-w-2xl leading-relaxed">
                {category.description}
              </p>
            </div>
          </div>
        </div>
      </div>

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

            {showBottleSumoRules && rulesPdf ? (
              <BottleSumoRulesSection pdfHref={rulesPdf} />
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline">
                <Link href="/robofest">Back to Robofest</Link>
              </Button>
              {rulesPdf ? (
                <RulesDownloadButton
                  href={rulesPdf}
                  label="Download BottleSumo rules (PDF)"
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
