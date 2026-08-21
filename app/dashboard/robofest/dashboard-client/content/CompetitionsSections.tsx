'use client'

import { ChevronDown } from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'
import type { RobofestContent } from '@/lib/robofest-content'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ContentSection } from '../ContentSection'

export function CompetitionsSections({
  content,
  setContent,
}: {
  content: RobofestContent
  setContent: Dispatch<SetStateAction<RobofestContent>>
}) {
  return (
    <>
      <ContentSection
        title="Competitions"
        description="Registration categories shown on the public Robofest pages."
        contentClassName="space-y-3"
      >
          {content.categories.map((category, index) => (
            <Collapsible
              key={category.slug || index}
              className="group/cat rounded-lg border border-slate-100 overflow-hidden"
            >
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <p className="font-medium text-slate-900 truncate">
                      {category.name || `Competition ${index + 1}`}
                    </p>
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-[10px] px-1.5 py-0',
                        category.active
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'bg-slate-100 text-slate-600',
                      )}
                    >
                      {category.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <ChevronDown className="w-4 h-4 shrink-0 text-slate-400 transition-transform group-data-[state=open]/cat:rotate-180" />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="border-t border-slate-100 px-3 py-3 space-y-3">
              <div className="flex flex-wrap gap-3 items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={category.active}
                    onChange={(e) => {
                      const active = e.target.checked
                      setContent((prev) => {
                        const categories = [...prev.categories]
                        categories[index] = { ...categories[index], active }
                        return { ...prev, categories }
                      })
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  Active
                </label>
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                {(
                  [
                    ['slug', 'Slug'],
                    ['name', 'Name'],
                    ['icon', 'Icon'],
                    ['image', 'Cover image'],
                    ['skillLevel', 'Skill level'],
                    ['format', 'Format'],
                    ['rulesPdf', 'Rules PDF'],
                  ] as const
                ).map(([field, label]) => (
                  <div key={field} className="space-y-1">
                    <label className="text-xs text-slate-500">{label}</label>
                    <Input
                      value={category[field] ?? ''}
                      onChange={(e) => {
                        const value = e.target.value
                        setContent((prev) => {
                          const categories = [...prev.categories]
                          categories[index] = {
                            ...categories[index],
                            [field]: value,
                          }
                          return { ...prev, categories }
                        })
                      }}
                    />
                  </div>
                ))}
                <div className="space-y-1">
                  <label className="text-xs text-slate-500">
                    Fee per member override (BDT, blank = use global)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={category.amount ?? ''}
                    onChange={(e) => {
                      const raw = e.target.value
                      setContent((prev) => {
                        const categories = [...prev.categories]
                        categories[index] = {
                          ...categories[index],
                          amount: raw === '' ? null : Number(raw) || 0,
                        }
                        return { ...prev, categories }
                      })
                    }}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500">Short description</label>
                <Textarea
                  rows={2}
                  value={category.description}
                  onChange={(e) => {
                    const value = e.target.value
                    setContent((prev) => {
                      const categories = [...prev.categories]
                      categories[index] = {
                        ...categories[index],
                        description: value,
                      }
                      return { ...prev, categories }
                    })
                  }}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500">About</label>
                <Textarea
                  rows={3}
                  value={category.about}
                  onChange={(e) => {
                    const value = e.target.value
                    setContent((prev) => {
                      const categories = [...prev.categories]
                      categories[index] = { ...categories[index], about: value }
                      return { ...prev, categories }
                    })
                  }}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500">
                  Highlights (one per line)
                </label>
                <Textarea
                  rows={4}
                  value={category.highlights.join('\n')}
                  onChange={(e) => {
                    const highlights = e.target.value
                      .split('\n')
                      .map((line) => line.trim())
                      .filter(Boolean)
                    setContent((prev) => {
                      const categories = [...prev.categories]
                      categories[index] = {
                        ...categories[index],
                        highlights,
                      }
                      return { ...prev, categories }
                    })
                  }}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500">Who should join</label>
                <Textarea
                  rows={2}
                  value={category.whoShouldJoin}
                  onChange={(e) => {
                    const value = e.target.value
                    setContent((prev) => {
                      const categories = [...prev.categories]
                      categories[index] = {
                        ...categories[index],
                        whoShouldJoin: value,
                      }
                      return { ...prev, categories }
                    })
                  }}
                />
              </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
      </ContentSection>

      <ContentSection
        title="How it works"
        description="Steps shown on the Robofest hub."
        contentClassName="space-y-3"
      >
          {content.howItWorks.map((step, index) => (
            <div
              key={index}
              className="grid sm:grid-cols-3 gap-2 border border-slate-100 rounded-lg p-3"
            >
              <div className="space-y-1">
                <label className="text-xs text-slate-500">Icon</label>
                <Input
                  value={step.icon}
                  onChange={(e) => {
                    const value = e.target.value
                    setContent((prev) => {
                      const howItWorks = [...prev.howItWorks]
                      howItWorks[index] = { ...howItWorks[index], icon: value }
                      return { ...prev, howItWorks }
                    })
                  }}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500">Title</label>
                <Input
                  value={step.title}
                  onChange={(e) => {
                    const value = e.target.value
                    setContent((prev) => {
                      const howItWorks = [...prev.howItWorks]
                      howItWorks[index] = {
                        ...howItWorks[index],
                        title: value,
                      }
                      return { ...prev, howItWorks }
                    })
                  }}
                />
              </div>
              <div className="space-y-1 sm:col-span-3">
                <label className="text-xs text-slate-500">Description</label>
                <Textarea
                  rows={2}
                  value={step.description}
                  onChange={(e) => {
                    const value = e.target.value
                    setContent((prev) => {
                      const howItWorks = [...prev.howItWorks]
                      howItWorks[index] = {
                        ...howItWorks[index],
                        description: value,
                      }
                      return { ...prev, howItWorks }
                    })
                  }}
                />
              </div>
            </div>
          ))}
      </ContentSection>
    </>
  )
}
