import Image from 'next/image'

type Props = {
  children: React.ReactNode
  /** Dark scrim for text contrast (gallery/news). Events uses none + blur decorations. */
  overlay: 'dark' | 'none'
  /** Prefer a static JPEG/WebP over animated GIF for LCP. */
  imageSrc?: string
}

export default function ListingHeroSection({
  overlay,
  children,
  imageSrc = '/roboclass.jpg',
}: Props) {
  const isAnimatedGif = imageSrc.toLowerCase().endsWith('.gif')

  return (
    <section className="relative text-white py-16 sm:py-20 md:py-24 px-4 sm:px-6 overflow-hidden">
      <Image
        src={imageSrc}
        alt=""
        fill
        priority
        unoptimized={isAnimatedGif}
        className="object-cover object-center"
        sizes="100vw"
        quality={75}
      />
      {overlay === 'dark' ? (
        <div className="absolute inset-0 z-[1] bg-slate-900/55" aria-hidden />
      ) : (
        <div className="absolute inset-0 z-[1] bg-slate-900/40" aria-hidden />
      )}
      <div className="relative z-10 min-h-0">{children}</div>
    </section>
  )
}
