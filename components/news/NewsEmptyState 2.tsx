import { Newspaper } from 'lucide-react'

export default function NewsEmptyState() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white px-6 py-16 text-center sm:px-10 sm:py-20">
      <div className="bg-tech-grid-ink pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div
        className="pointer-events-none absolute -top-20 right-0 h-48 w-48 rounded-full bg-indigo-200/40 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-24 left-0 h-48 w-48 rounded-full bg-sky-200/40 blur-3xl"
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-md">
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-indigo-50 ring-1 ring-indigo-100 sm:size-20">
          <Newspaper className="size-8 text-indigo-600 sm:size-9" aria-hidden />
        </div>
        <h2 className="mt-6 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
          No published stories yet
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-gray-600 sm:text-base">
          News, workshops, competitions and community updates will appear here soon.
        </p>
      </div>
    </div>
  )
}
