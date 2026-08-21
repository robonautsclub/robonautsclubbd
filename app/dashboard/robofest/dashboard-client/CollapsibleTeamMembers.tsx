'use client'

import { Award, ChevronDown } from 'lucide-react'
import type { RobofestTeamMember } from '@/lib/robofest-content'
import {
  getActiveRobofestAwardCategories,
  ROBOFEST_DEFAULT_AWARD_CATEGORY_ID,
  type RobofestAwardCategory,
} from '@/lib/robofest-award-categories'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

export function CollapsibleTeamMembers({
  registrationId,
  teamSize,
  members,
  awardCategories,
  canDownloadCertificate,
  onDownloadCertificate,
  onAwardChange,
  certificatePending,
}: {
  registrationId: string
  teamSize?: number
  members?: RobofestTeamMember[]
  awardCategories: RobofestAwardCategory[]
  canDownloadCertificate?: boolean
  onDownloadCertificate?: (memberIndex: number) => void
  onAwardChange?: (memberIndex: number, awardCategoryId: string) => void
  certificatePending?: boolean
}) {
  const count = teamSize || members?.length || 0
  const activeAwards = getActiveRobofestAwardCategories(awardCategories)

  if (!members?.length) {
    return (
      <div className="text-xs">
        <div className="font-medium text-slate-800">
          {count} member{count === 1 ? '' : 's'}
        </div>
        {canDownloadCertificate && onDownloadCertificate ? (
          <button
            type="button"
            disabled={certificatePending}
            onClick={() => onDownloadCertificate(0)}
            title="Download participation certificate"
            className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-cyan-700 hover:text-cyan-900 disabled:opacity-50"
          >
            <Award className="w-3 h-3" />
            Certificate
          </button>
        ) : (
          <span className="text-slate-400">—</span>
        )}
      </div>
    )
  }

  const preview = members
    .slice(0, 2)
    .map((m) => m.name)
    .filter(Boolean)
    .join(', ')
  const remaining = Math.max(0, members.length - 2)

  return (
    <Collapsible className="group/team text-xs min-w-[11rem] max-w-[22rem]">
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="w-full text-left rounded-md border border-transparent hover:border-slate-200 hover:bg-slate-50/80 px-1.5 py-1 -mx-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="font-medium text-slate-800">
                {count} member{count === 1 ? '' : 's'}
              </div>
              <div className="text-[11px] text-slate-500 truncate mt-0.5">
                {preview}
                {remaining > 0 ? ` +${remaining}` : ''}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 shrink-0 text-slate-400 mt-0.5 transition-transform group-data-[state=open]/team:rotate-180" />
          </div>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-1.5 data-[state=closed]:animate-none">
        <ul className="space-y-2 rounded-md border border-slate-100 bg-slate-50/80 p-2 text-slate-600">
          {members.map((m, i) => {
            const awardId =
              m.awardCategoryId || ROBOFEST_DEFAULT_AWARD_CATEGORY_ID
            return (
              <li
                key={`${registrationId}-m-${i}`}
                className="leading-snug space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="font-medium text-slate-800">
                      {String(i + 1).padStart(2, '0')}. {m.name}
                    </span>
                    <div className="text-[11px] text-slate-500 break-words">
                      {[m.grade, m.school, m.branch, m.phone, m.email]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                  </div>
                  {canDownloadCertificate && onDownloadCertificate ? (
                    <button
                      type="button"
                      disabled={certificatePending}
                      onClick={(e) => {
                        e.stopPropagation()
                        onDownloadCertificate(i)
                      }}
                      title={`Download certificate for ${m.name}`}
                      className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-cyan-700 hover:bg-cyan-50 hover:text-cyan-900 disabled:opacity-50"
                    >
                      <Award className="w-3.5 h-3.5" />
                    </button>
                  ) : null}
                </div>
                {onAwardChange ? (
                  <select
                    className="h-7 w-full rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-700"
                    value={awardId}
                    disabled={certificatePending}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      e.stopPropagation()
                      onAwardChange(i, e.target.value)
                    }}
                    title="Award category"
                  >
                    {activeAwards.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                    {!activeAwards.some((c) => c.id === awardId) ? (
                      <option value={awardId}>{awardId}</option>
                    ) : null}
                  </select>
                ) : null}
              </li>
            )
          })}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  )
}
