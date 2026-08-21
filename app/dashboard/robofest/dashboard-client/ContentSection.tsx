'use client'

import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

export function ContentSection({
  title,
  description,
  icon,
  defaultOpen = false,
  children,
  contentClassName,
}: {
  title: string
  description?: string
  icon?: ReactNode
  defaultOpen?: boolean
  children: ReactNode
  contentClassName?: string
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card
        className={cn(
          'border-slate-200 shadow-sm py-0 gap-0',
          open ? 'overflow-visible relative z-10' : 'overflow-hidden',
        )}
      >
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left hover:bg-cyan-50/50 transition-colors"
          >
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                {icon}
                {title}
              </h3>
              {description ? (
                <p className="text-xs text-slate-500 mt-0.5 font-normal">
                  {description}
                </p>
              ) : null}
            </div>
            <ChevronDown
              className={cn(
                'w-4 h-4 shrink-0 text-slate-400 mt-1 transition-transform duration-200',
                open && 'rotate-180',
              )}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="overflow-visible">
          <CardContent
            className={cn(
              'pt-3 pb-4 border-t border-slate-100 overflow-visible',
              contentClassName,
            )}
          >
            {children}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
