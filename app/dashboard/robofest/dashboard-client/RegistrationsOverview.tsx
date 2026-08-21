'use client'

import { CreditCard, Filter, Layers, Trophy, Users } from 'lucide-react'
import type { RobofestContent, RobofestRegistrationStatus } from '@/lib/robofest-content'
import type { RobofestCampusAmbassador } from '@/lib/robofest-campus-ambassadors'
import { formatAgeCategoryLabel } from '@/lib/robofest-registration-options'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import CreateRobofestRegistrationForm from '../CreateRobofestRegistrationForm'
import type { StatusTone } from './types'

type Stats = {
  total: number
  registrations: number
  byCategory: [string, number][]
  byAge: [string, number][]
  paidTotal: number
  paidCount: number
}

export function RegistrationsOverview({
  statusTab,
  statusTone,
  filtersActive,
  filteredCount,
  statusScopedCount,
  hasMore,
  clearFilters,
  canCreate,
  content,
  schools,
  campusAmbassadors,
  canViewPayments,
  canSendMail,
  onCreated,
  stats,
}: {
  statusTab: RobofestRegistrationStatus
  statusTone: StatusTone
  filtersActive: boolean
  filteredCount: number
  statusScopedCount: number
  hasMore: boolean
  clearFilters: () => void
  canCreate: boolean
  content: RobofestContent
  schools: string[]
  campusAmbassadors: RobofestCampusAmbassador[]
  canViewPayments: boolean
  canSendMail: boolean
  onCreated: () => void
  stats: Stats
}) {
  return (
    <>
      <div className="relative px-4 sm:px-5 py-4 sm:py-5 border-b border-slate-100 bg-linear-to-br from-slate-50 via-white to-cyan-50/50">
        <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-cyan-600 via-teal-500 to-slate-700" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset capitalize',
                  statusTone.badge,
                )}
              >
                {statusTab}
              </span>
              {filtersActive ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                  <Filter className="w-3 h-3" />
                  Filtered
                </span>
              ) : null}
            </div>
            <p className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
              <span className="tabular-nums text-cyan-800">
                {filteredCount}
              </span>{' '}
              loaded {statusTab} registration
              {filteredCount === 1 ? '' : 's'}
              <span className="ml-1.5 text-sm font-medium text-slate-500">
                of {statusScopedCount} in this tab
                {hasMore ? ' · more available' : ''}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {filtersActive ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="border-slate-200 text-slate-700"
              >
                Clear filters
              </Button>
            ) : null}
            {canCreate ? (
              <CreateRobofestRegistrationForm
                content={content}
                schools={schools}
                campusAmbassadors={campusAmbassadors.filter(
                  (a) => a.isActive,
                )}
                canViewPayments={canViewPayments}
                canSendMail={canSendMail}
                onCreated={onCreated}
              />
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-12 gap-0 divide-y sm:divide-y-0 xl:divide-x divide-slate-100">
        <div className="xl:col-span-2 sm:border-r border-slate-100 p-4 sm:p-5 space-y-4">
          <div className="rounded-xl bg-slate-50/80 border border-slate-100 p-3.5">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <Users className="w-3.5 h-3.5 text-cyan-700" />
              <p className="text-[11px] font-semibold uppercase tracking-wide">
                Participants
              </p>
            </div>
            <p className="text-3xl font-bold tabular-nums text-slate-900 tracking-tight">
              {stats.total}
            </p>
            <p className="text-xs font-medium text-slate-500 mt-1 tabular-nums">
              {stats.registrations} loaded team
              {stats.registrations === 1 ? '' : 's'}
            </p>
          </div>
          {canViewPayments ? (
          <div className="rounded-xl bg-emerald-50/70 border border-emerald-100 p-3.5">
            <div className="flex items-center gap-2 text-emerald-700/80 mb-2">
              <CreditCard className="w-3.5 h-3.5" />
              <p className="text-[11px] font-semibold uppercase tracking-wide">
                Paid (loaded)
              </p>
            </div>
            <p className="text-3xl font-bold tabular-nums text-emerald-800 tracking-tight">
              BDT {stats.paidTotal.toLocaleString()}
            </p>
            <p className="text-xs font-medium text-emerald-700/80 mt-1 tabular-nums">
              {stats.paidCount} payment{stats.paidCount === 1 ? '' : 's'}
            </p>
          </div>
          ) : null}
        </div>
    
        <div className="xl:col-span-5 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2 mb-3.5">
            <div className="flex items-center gap-2">
              <Trophy className="w-3.5 h-3.5 text-cyan-700" />
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                By competition (loaded)
              </p>
            </div>
            <span className="text-[11px] font-medium text-slate-400 tabular-nums">
              {stats.byCategory.length}{' '}
              {stats.byCategory.length === 1 ? 'event' : 'events'}
            </span>
          </div>
          {stats.byCategory.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">
              No registrations in this view
            </p>
          ) : (
            <ul className="space-y-3">
              {stats.byCategory
                .slice()
                .sort((a, b) => b[1] - a[1])
                .map(([name, count]) => {
                  const pct =
                    stats.total > 0
                      ? Math.round((count / stats.total) * 100)
                      : 0
                  return (
                    <li key={name}>
                      <div className="flex items-center justify-between gap-3 text-sm mb-1.5">
                        <span className="font-medium text-slate-800 truncate">
                          {name}
                        </span>
                        <span className="shrink-0 tabular-nums">
                          <span className="font-bold text-slate-900">
                            {count}
                          </span>
                          <span className="text-slate-400 text-xs ml-1.5">
                            {pct}%
                          </span>
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full bg-linear-to-r transition-[width] duration-300',
                            statusTone.bar,
                          )}
                          style={{ width: `${Math.max(pct, 6)}%` }}
                        />
                      </div>
                    </li>
                  )
                })}
            </ul>
          )}
        </div>
    
        <div className="xl:col-span-5 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3.5">
            <Layers className="w-3.5 h-3.5 text-cyan-700" />
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              By age category
            </p>
          </div>
          {stats.byAge.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">
              No age data yet
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(['explorer', 'innovators'] as const).map((ageKey) => {
                const count =
                  stats.byAge.find(([key]) => key === ageKey)?.[1] ?? 0
                const pct =
                  stats.total > 0
                    ? Math.round((count / stats.total) * 100)
                    : 0
                const isExplorer = ageKey === 'explorer'
                return (
                  <div
                    key={ageKey}
                    className={cn(
                      'rounded-xl border px-3.5 py-3 transition-colors',
                      isExplorer
                        ? 'border-teal-100 bg-linear-to-br from-teal-50 to-white'
                        : 'border-cyan-100 bg-linear-to-br from-cyan-50 to-white',
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p
                          className={cn(
                            'text-sm font-semibold',
                            isExplorer ? 'text-teal-900' : 'text-cyan-900',
                          )}
                        >
                          {isExplorer ? 'Explorer' : 'Innovators'}
                        </p>
                        <p
                          className={cn(
                            'text-[11px] mt-0.5',
                            isExplorer ? 'text-teal-600' : 'text-cyan-600',
                          )}
                        >
                          {isExplorer
                            ? 'Grades 05 – 08'
                            : 'Grades 09 – 12'}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p
                          className={cn(
                            'text-2xl font-bold tabular-nums leading-none',
                            isExplorer ? 'text-teal-800' : 'text-cyan-800',
                          )}
                        >
                          {count}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          {pct}%
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
              {stats.byAge
                .filter(
                  ([key]) => key !== 'explorer' && key !== 'innovators',
                )
                .map(([name, count]) => (
                  <div
                    key={name}
                    className="rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-3 flex items-center justify-between gap-2 sm:col-span-2"
                  >
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {formatAgeCategoryLabel(name)}
                    </p>
                    <p className="text-lg font-bold tabular-nums text-slate-900">
                      {count}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
