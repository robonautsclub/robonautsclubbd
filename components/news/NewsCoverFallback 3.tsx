import { Newspaper } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  className?: string
  /** Larger treatment for featured / cover slots */
  size?: 'card' | 'featured' | 'cover'
}

export default function NewsCoverFallback({ className, size = 'card' }: Props) {
  return (
    <div
      className={cn(
        'relative flex h-full w-full items-center justify-center overflow-hidden',
        'bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900',
        className,
      )}
      aria-hidden
    >
      <div className="bg-tech-grid absolute inset-0 opacity-50" />
      <div className="bg-circuit-dots absolute inset-0 opacity-40" />
      <div className="pointer-events-none absolute -top-16 -right-10 h-40 w-40 rounded-full bg-indigo-500/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-44 w-44 rounded-full bg-sky-500/20 blur-3xl" />

      <div
        className={cn(
          'relative z-10 flex flex-col items-center gap-2 text-center',
          size === 'featured' && 'gap-3',
        )}
      >
        <div
          className={cn(
            'flex items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm',
            size === 'card' && 'size-14',
            size === 'featured' && 'size-16 sm:size-20',
            size === 'cover' && 'size-16 sm:size-20',
          )}
        >
          <Newspaper
            className={cn(
              'text-indigo-200',
              size === 'card' && 'size-7',
              size === 'featured' && 'size-8 sm:size-10',
              size === 'cover' && 'size-8 sm:size-10',
            )}
          />
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-sky-200/90 sm:text-[11px]">
          Robonauts
        </p>
      </div>
    </div>
  )
}
