type Props = {
  children: React.ReactNode
  /** Dark scrim for text contrast (gallery/news). Events uses none + blur decorations. */
  overlay: 'dark' | 'none'
  /** Same hero asset as before the perf refactor (GIF + CSS keeps colors/animation). */
  imageSrc?: string
}

export default function ListingHeroSection({
  overlay,
  children,
  imageSrc = '/robobanner.gif',
}: Props) {
  return (
    <section
      className="relative text-white py-16 sm:py-20 md:py-24 px-4 sm:px-6 overflow-hidden"
      style={{
        backgroundImage: `url('${imageSrc}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {overlay === 'dark' ? (
        <div className="absolute inset-0 z-[1] bg-slate-900/55" aria-hidden />
      ) : null}
      <div className="relative z-10 min-h-0">{children}</div>
    </section>
  )
}
