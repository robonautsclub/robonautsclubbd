'use client'

import { Award } from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'
import type { RobofestContent } from '@/lib/robofest-content'
import {
  nextCustomAwardCategoryId,
  ROBOFEST_CERTIFICATE_TYPES,
  type RobofestAwardAccent,
  type RobofestCertificateType,
} from '@/lib/robofest-award-categories'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ContentSection } from '../ContentSection'

export function AwardCategoriesSection({
  content,
  setContent,
}: {
  content: RobofestContent
  setContent: Dispatch<SetStateAction<RobofestContent>>
}) {
  return (
    <ContentSection
      title="Award categories"
      description="Built-in and custom awards used on certificates. Save content to persist."
      icon={<Award className="w-4 h-4 text-cyan-500" />}
      contentClassName="space-y-4"
    >
      <div className="space-y-3">
        {(content.awardCategories || []).map((cat, index) => (
          <div
            key={cat.id}
            className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 space-y-2"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Badge
                  variant="secondary"
                  className={
                    cat.isBuiltIn
                      ? 'bg-cyan-100 text-cyan-800'
                      : 'bg-slate-200 text-slate-700'
                  }
                >
                  {cat.isBuiltIn ? 'Built-in' : 'Custom'}
                </Badge>
                <span className="text-xs font-mono text-slate-500 truncate">
                  {cat.id}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs text-slate-600">
                  <Checkbox
                    checked={cat.isActive !== false}
                    onCheckedChange={(v) => {
                      const checked = v === true
                      setContent((prev) => {
                        const awardCategories = [
                          ...(prev.awardCategories || []),
                        ]
                        awardCategories[index] = {
                          ...awardCategories[index],
                          isActive: checked,
                        }
                        return { ...prev, awardCategories }
                      })
                    }}
                  />
                  Active
                </label>
                {!cat.isBuiltIn ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-200"
                    onClick={() => {
                      if (
                        !confirm(
                          `Remove custom award “${cat.label}”? Members still using it will fall back to Participant.`,
                        )
                      ) {
                        return
                      }
                      setContent((prev) => ({
                        ...prev,
                        awardCategories: (prev.awardCategories || []).filter(
                          (c) => c.id !== cat.id,
                        ),
                      }))
                    }}
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-slate-500">Label</label>
                <Input
                  value={cat.label}
                  onChange={(e) => {
                    const value = e.target.value
                    setContent((prev) => {
                      const awardCategories = [
                        ...(prev.awardCategories || []),
                      ]
                      awardCategories[index] = {
                        ...awardCategories[index],
                        label: value,
                      }
                      return { ...prev, awardCategories }
                    })
                  }}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500">Accent</label>
                <select
                  className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                  value={cat.accent || 'slate'}
                  onChange={(e) => {
                    const value = e.target.value as RobofestAwardAccent
                    setContent((prev) => {
                      const awardCategories = [
                        ...(prev.awardCategories || []),
                      ]
                      awardCategories[index] = {
                        ...awardCategories[index],
                        accent: value,
                      }
                      return { ...prev, awardCategories }
                    })
                  }}
                >
                  <option value="cyan">Cyan</option>
                  <option value="gold">Gold</option>
                  <option value="silver">Silver</option>
                  <option value="bronze">Bronze</option>
                  <option value="slate">Slate</option>
                </select>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs text-slate-500">
                  Certificate type
                </label>
                <select
                  className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                  value={cat.certificateType || 'achievement'}
                  onChange={(e) => {
                    const value = e.target.value as RobofestCertificateType
                    setContent((prev) => {
                      const awardCategories = [
                        ...(prev.awardCategories || []),
                      ]
                      awardCategories[index] = {
                        ...awardCategories[index],
                        certificateType: value,
                      }
                      return { ...prev, awardCategories }
                    })
                  }}
                >
                  {ROBOFEST_CERTIFICATE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs text-slate-500">
                  Certificate title
                </label>
                <Input
                  value={cat.certificateTitle}
                  onChange={(e) => {
                    const value = e.target.value
                    setContent((prev) => {
                      const awardCategories = [
                        ...(prev.awardCategories || []),
                      ]
                      awardCategories[index] = {
                        ...awardCategories[index],
                        certificateTitle: value,
                      }
                      return { ...prev, awardCategories }
                    })
                  }}
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs text-slate-500">
                  Certificate body (after the name)
                </label>
                <Input
                  value={cat.certificateBody}
                  onChange={(e) => {
                    const value = e.target.value
                    setContent((prev) => {
                      const awardCategories = [
                        ...(prev.awardCategories || []),
                      ]
                      awardCategories[index] = {
                        ...awardCategories[index],
                        certificateBody: value,
                      }
                      return { ...prev, awardCategories }
                    })
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-dashed border-cyan-200 bg-cyan-50/40 p-3 space-y-2">
        <p className="text-sm font-medium text-slate-800">
          Add custom award
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            className="bg-cyan-700 hover:bg-cyan-800 text-white"
            onClick={() => {
              setContent((prev) => {
                const existing = prev.awardCategories || []
                const label = 'New Award'
                const id = nextCustomAwardCategoryId(existing, label)
                return {
                  ...prev,
                  awardCategories: [
                    ...existing,
                    {
                      id,
                      label,
                      certificateTitle: 'CERTIFICATE OF ACHIEVEMENT',
                      certificateBody: 'for achieving this recognition in',
                      certificateType: 'achievement',
                      accent: 'slate',
                      isBuiltIn: false,
                      isActive: true,
                    },
                  ],
                }
              })
            }}
          >
            Add category
          </Button>
        </div>
      </div>
    </ContentSection>
  )
}
