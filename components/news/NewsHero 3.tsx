import { Cpu } from 'lucide-react'

export default function NewsHero() {
  return (
    <section className="relative overflow-hidden bg-[#050816] text-white">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(79,70,229,0.35),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(14,165,233,0.22),transparent_50%)]"
        aria-hidden
      />

      <div
        className="pointer-events-none absolute inset-0 opacity-40 mix-blend-screen"
        style={{
          backgroundImage: "url('/bg.svg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        aria-hidden
      />

      <div
        className="bg-tech-grid pointer-events-none absolute inset-0 opacity-50 mask-[radial-gradient(ellipse_at_center,transparent_18%,black_72%)]"
        aria-hidden
      />
      <div className="bg-circuit-dots pointer-events-none absolute inset-0 opacity-25" aria-hidden />

      <div
        className="animate-hud-scan pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-b from-sky-400/15 to-transparent"
        aria-hidden
      />

      <div
        className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-indigo-500/30 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-28 -left-10 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl"
        aria-hidden
      />

      <span
        className="pointer-events-none absolute top-4 left-4 h-10 w-10 border-t-2 border-l-2 border-cyan-300/50 sm:top-6 sm:left-6"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute top-4 right-4 h-10 w-10 border-t-2 border-r-2 border-cyan-300/50 sm:top-6 sm:right-6"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute bottom-4 left-4 h-10 w-10 border-b-2 border-l-2 border-cyan-300/40 sm:bottom-6 sm:left-6"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute right-4 bottom-4 h-10 w-10 border-r-2 border-b-2 border-cyan-300/40 sm:right-6 sm:bottom-6"
        aria-hidden
      />

      <span
        className="pointer-events-none absolute top-[28%] left-[12%] size-1.5 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_12px_#67e8f9] motion-reduce:animate-none"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute top-[38%] right-[16%] size-1.5 animate-pulse rounded-full bg-indigo-300 shadow-[0_0_12px_#a5b4fc] motion-reduce:animate-none"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute bottom-[22%] left-[22%] size-1 rounded-full bg-sky-200 shadow-[0_0_10px_#7dd3fc]"
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-14 text-center sm:px-6 sm:py-16 md:py-20 lg:px-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-white/5 px-3 py-1.5 shadow-[0_0_24px_rgba(34,211,238,0.15)] backdrop-blur-sm sm:mb-5 sm:px-4">
          <Cpu className="size-3.5 text-cyan-200 sm:size-4" aria-hidden />
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-100 sm:text-xs">
            Club News
          </span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
          News &amp; Stories
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-sky-100/90 sm:mt-4 sm:text-base md:text-lg">
          Follow the latest workshops, competitions, achievements, partnerships and stories from
          the Robonauts community.
        </p>
      </div>
    </section>
  )
}
