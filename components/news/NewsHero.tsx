import { Newspaper } from 'lucide-react'

export default function NewsHero() {
  return (
    <section className="relative overflow-hidden bg-linear-to-br from-slate-950 via-indigo-950 to-slate-900 text-white">
      <div className="bg-tech-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden />
      <div className="bg-circuit-dots pointer-events-none absolute inset-0 opacity-30" aria-hidden />
      <div
        className="pointer-events-none absolute -top-24 right-0 h-64 w-64 rounded-full bg-indigo-500/25 blur-3xl sm:h-80 sm:w-80"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-28 -left-16 h-56 w-56 rounded-full bg-sky-500/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 h-px w-[min(100%,42rem)] -translate-x-1/2 -translate-y-1/2 bg-linear-to-r from-transparent via-indigo-400/30 to-transparent"
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-12 text-center sm:px-6 sm:py-14 md:py-16 lg:px-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/15 backdrop-blur-sm sm:mb-5 sm:px-4">
          <Newspaper className="size-3.5 text-sky-200 sm:size-4" aria-hidden />
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-100 sm:text-xs">
            Club News
          </span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
          News &amp; Stories
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-blue-100/95 sm:mt-4 sm:text-base md:text-lg">
          Follow the latest workshops, competitions, achievements, partnerships and stories from
          the Robonauts community.
        </p>
      </div>
    </section>
  )
}
