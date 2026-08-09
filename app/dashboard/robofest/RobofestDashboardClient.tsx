'use client'

import { useMemo, useState, useTransition, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
  Mail,
  Trophy,
} from 'lucide-react'
import type {
  RobofestContent,
  RobofestRegistration,
  RobofestRegistrationStatus,
  RobofestTeamMember,
} from '@/lib/robofest-content'
import { formatAgeCategoryLabel } from '@/lib/robofest-registration-options'
import { cn } from '@/lib/utils'
import {
  resendRobofestRegistrationEmail,
  resetRobofestContentToDefaults,
  updateRobofestContent,
  updateRobofestRegistrationStatus,
} from './actions'
import {
  exportRobofestCsv,
  exportRobofestExcel,
  exportRobofestPdf,
} from './exportRobofestRegistrations'
import CreateRobofestRegistrationForm from './CreateRobofestRegistrationForm'
import DatePicker from '@/app/dashboard/events/DatePicker'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

function ContentSection({
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
          'border-gray-200/80 shadow-sm py-0 gap-0',
          open ? 'overflow-visible relative z-10' : 'overflow-hidden',
        )}
      >
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left hover:bg-gray-50/80 transition-colors"
          >
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                {icon}
                {title}
              </h3>
              {description ? (
                <p className="text-xs text-gray-500 mt-0.5 font-normal">
                  {description}
                </p>
              ) : null}
            </div>
            <ChevronDown
              className={cn(
                'w-4 h-4 shrink-0 text-gray-400 mt-1 transition-transform duration-200',
                open && 'rotate-180',
              )}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="overflow-visible">
          <CardContent
            className={cn(
              'pt-3 pb-4 border-t border-gray-100 overflow-visible',
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

type Props = {
  initialContent: RobofestContent
  registrations: RobofestRegistration[]
  schools: string[]
}

function statusBadgeClass(status: string) {
  if (status === 'confirmed') {
    return 'bg-emerald-50 text-emerald-800 hover:bg-emerald-50 border-emerald-100'
  }
  if (status === 'cancelled') {
    return 'bg-rose-50 text-rose-800 hover:bg-rose-50 border-rose-100'
  }
  return 'bg-amber-50 text-amber-800 hover:bg-amber-50 border-amber-100'
}

function CollapsibleTeamMembers({
  registrationId,
  teamSize,
  members,
}: {
  registrationId: string
  teamSize?: number
  members?: RobofestTeamMember[]
}) {
  const count = teamSize || members?.length || 0
  if (!members?.length) {
    return (
      <div className="text-xs">
        <div className="font-medium text-gray-800">
          {count} member{count === 1 ? '' : 's'}
        </div>
        <span className="text-gray-400">—</span>
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
    <Collapsible className="group/team text-xs min-w-[11rem] max-w-[18rem]">
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="w-full text-left rounded-md border border-transparent hover:border-gray-200 hover:bg-gray-50/80 px-1.5 py-1 -mx-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="font-medium text-gray-800">
                {count} member{count === 1 ? '' : 's'}
              </div>
              <div className="text-[11px] text-gray-500 truncate mt-0.5">
                {preview}
                {remaining > 0 ? ` +${remaining}` : ''}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 shrink-0 text-gray-400 mt-0.5 transition-transform group-data-[state=open]/team:rotate-180" />
          </div>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-1.5 data-[state=closed]:animate-none">
        <ul className="space-y-1.5 rounded-md border border-gray-100 bg-gray-50/80 p-2 text-gray-600">
          {members.map((m, i) => (
            <li key={`${registrationId}-m-${i}`} className="leading-snug">
              <span className="font-medium text-gray-800">
                {String(i + 1).padStart(2, '0')}. {m.name}
              </span>
              <div className="text-[11px] text-gray-500 break-words">
                {[m.grade, m.school, m.branch, m.phone, m.email]
                  .filter(Boolean)
                  .join(' · ')}
              </div>
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  )
}

export default function RobofestDashboardClient({
  initialContent,
  registrations,
  schools,
}: Props) {
  const router = useRouter()
  const [content, setContent] = useState(initialContent)
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [categoryFilter, setCategoryFilter] = useState('')
  const [roundFilter, setRoundFilter] = useState('')
  const [ageCategoryFilter, setAgeCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [nameFilter, setNameFilter] = useState('')
  const [exportPending, startExportTransition] = useTransition()

  const filtersActive = Boolean(
    categoryFilter ||
      roundFilter ||
      ageCategoryFilter ||
      statusFilter ||
      nameFilter.trim(),
  )

  const filtered = useMemo(() => {
    const name = nameFilter.trim().toLowerCase()
    return registrations.filter((r) => {
      if (categoryFilter && r.category !== categoryFilter) return false
      if (roundFilter && r.roundCity !== roundFilter) return false
      if (ageCategoryFilter && r.ageCategory !== ageCategoryFilter) return false
      if (statusFilter && r.status !== statusFilter) return false
      if (name) {
        const haystack = [
          r.name,
          r.teamNumber,
          r.registrationId,
          r.email,
          r.phone,
          r.school,
          r.campusAmbassadorName,
          ...(r.teamMembers || []).flatMap((m) => [
            m.name,
            m.email,
            m.phone,
            m.school,
          ]),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(name)) return false
      }
      return true
    })
  }, [
    registrations,
    categoryFilter,
    roundFilter,
    ageCategoryFilter,
    statusFilter,
    nameFilter,
  ])

  const stats = useMemo(() => {
    const source = filtersActive ? filtered : registrations
    const byCategory = new Map<string, number>()
    const byAge = new Map<string, number>()
    let paidTotal = 0
    let paidCount = 0
    for (const r of source) {
      byCategory.set(r.category, (byCategory.get(r.category) || 0) + 1)
      if (r.ageCategory) {
        byAge.set(r.ageCategory, (byAge.get(r.ageCategory) || 0) + 1)
      }
      if (r.paymentStatus === 'paid' && typeof r.amountPaid === 'number') {
        paidTotal += r.amountPaid
        paidCount += 1
      }
    }
    return {
      total: source.length,
      byCategory: Array.from(byCategory.entries()),
      byAge: Array.from(byAge.entries()),
      paidTotal,
      paidCount,
    }
  }, [registrations, filtered, filtersActive])

  const clearFilters = () => {
    setCategoryFilter('')
    setRoundFilter('')
    setAgeCategoryFilter('')
    setStatusFilter('')
    setNameFilter('')
  }

  const runExport = (kind: 'csv' | 'excel' | 'pdf') => {
    startExportTransition(() => {
      ;(async () => {
        try {
          if (kind === 'csv') exportRobofestCsv(filtered)
          else if (kind === 'excel') await exportRobofestExcel(filtered)
          else await exportRobofestPdf(filtered)
        } catch (err) {
          console.error(`Robofest ${kind} export failed:`, err)
          alert(`Failed to export ${kind.toUpperCase()}. Please try again.`)
        }
      })()
    })
  }

  const categoryNames = useMemo(
    () =>
      Array.from(
        new Set([
          ...content.categories.map((c) => c.name),
          ...registrations.map((r) => r.category),
        ]),
      ).filter(Boolean),
    [content.categories, registrations],
  )

  const roundCities = useMemo(
    () =>
      Array.from(
        new Set([
          ...content.rounds.map((r) => r.city),
          ...registrations.map((r) => r.roundCity),
        ]),
      ).filter(Boolean),
    [content.rounds, registrations],
  )

  const saveContent = () => {
    setMessage('')
    setError('')
    startTransition(async () => {
      const result = await updateRobofestContent(content)
      if (!result.success) {
        setError(result.error || 'Failed to save.')
        return
      }
      setMessage('Content saved. Public Robofest pages will refresh.')
      router.refresh()
    })
  }

  const resetContent = () => {
    if (!confirm('Reset all Robofest content to code defaults?')) return
    setMessage('')
    setError('')
    startTransition(async () => {
      const result = await resetRobofestContentToDefaults()
      if (!result.success) {
        setError(result.error || 'Failed to reset.')
        return
      }
      if (result.content) setContent(result.content)
      setMessage('Content reset to defaults.')
      router.refresh()
    })
  }

  const setStatus = (id: string, status: RobofestRegistrationStatus) => {
    startTransition(async () => {
      const result = await updateRobofestRegistrationStatus(id, status)
      if (!result.success) {
        alert(result.error || 'Failed to update status')
        return
      }
      router.refresh()
    })
  }

  const resendEmail = (id: string) => {
    startTransition(async () => {
      const result = await resendRobofestRegistrationEmail(id)
      if (!result.success) {
        alert(result.error || 'Failed to resend email')
        return
      }
      const n = result.recipientCount ?? 0
      const times = result.emailSendCount ?? 0
      alert(
        n > 0
          ? `Confirmation email sent to ${n} team member${n === 1 ? '' : 's'} (send #${times}).`
          : 'Confirmation email resent.',
      )
      router.refresh()
    })
  }

  return (
    <Tabs defaultValue="registrations" className="space-y-5 w-full min-w-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Robofest
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Local-round registrations, competition content, and exports.
          </p>
        </div>
        <TabsList className="w-full sm:w-fit shrink-0">
          <TabsTrigger value="registrations" className="flex-1 sm:flex-none">
            Registrations
          </TabsTrigger>
          <TabsTrigger value="content" className="flex-1 sm:flex-none">
            Content
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="registrations" className="space-y-4 w-full min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-gray-600">
            Showing{' '}
            <span className="font-semibold text-gray-900">{filtered.length}</span>
            {filtersActive ? (
              <>
                {' '}
                matching of{' '}
                <span className="font-semibold text-gray-900">
                  {registrations.length}
                </span>{' '}
                total
              </>
            ) : (
              <> registrations</>
            )}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <CreateRobofestRegistrationForm
              content={content}
              schools={schools}
            />
            {filtersActive ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearFilters}
              >
                Clear filters
              </Button>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-3 grid grid-cols-2 gap-3">
            <Card className="border-gray-200/80 shadow-sm">
              <CardContent className="p-3.5 sm:p-4">
                <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                  {filtersActive ? 'Matching' : 'Total'}
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 tabular-nums">
                  {stats.total}
                </p>
              </CardContent>
            </Card>
            <Card className="border-gray-200/80 shadow-sm">
              <CardContent className="p-3.5 sm:p-4">
                <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                  Paid
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-emerald-700 mt-1 tabular-nums">
                  {stats.paidCount}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 tabular-nums">
                  BDT {stats.paidTotal.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="lg:col-span-5 border-gray-200/80 shadow-sm overflow-hidden">
            <CardContent className="p-3.5 sm:p-4">
              <div className="flex items-center justify-between gap-2 mb-3">
                <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                  By competition
                </p>
                <span className="text-[11px] text-gray-400">
                  {stats.byCategory.length}{' '}
                  {stats.byCategory.length === 1 ? 'event' : 'events'}
                </span>
              </div>
              {stats.byCategory.length === 0 ? (
                <p className="text-sm text-gray-400 py-2">No registrations yet</p>
              ) : (
                <ul className="space-y-2.5">
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
                          <div className="flex items-center justify-between gap-3 text-sm mb-1">
                            <span className="font-medium text-gray-800 truncate">
                              {name}
                            </span>
                            <span className="shrink-0 tabular-nums text-gray-600">
                              <span className="font-semibold text-gray-900">
                                {count}
                              </span>
                              <span className="text-gray-400 text-xs ml-1">
                                {pct}%
                              </span>
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-indigo-500/80 transition-[width] duration-300"
                              style={{ width: `${Math.max(pct, 4)}%` }}
                            />
                          </div>
                        </li>
                      )
                    })}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-4 border-gray-200/80 shadow-sm overflow-hidden">
            <CardContent className="p-3.5 sm:p-4">
              <div className="flex items-center justify-between gap-2 mb-3">
                <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                  By age category
                </p>
              </div>
              {stats.byAge.length === 0 ? (
                <p className="text-sm text-gray-400 py-2">No age data yet</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
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
                          'rounded-xl border px-3 py-2.5',
                          isExplorer
                            ? 'border-violet-100 bg-violet-50/70'
                            : 'border-sky-100 bg-sky-50/70',
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p
                              className={cn(
                                'text-sm font-semibold',
                                isExplorer ? 'text-violet-900' : 'text-sky-900',
                              )}
                            >
                              {isExplorer ? 'Explorer' : 'Innovators'}
                            </p>
                            <p
                              className={cn(
                                'text-[11px] mt-0.5',
                                isExplorer ? 'text-violet-600' : 'text-sky-600',
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
                                'text-xl font-bold tabular-nums leading-none',
                                isExplorer ? 'text-violet-800' : 'text-sky-800',
                              )}
                            >
                              {count}
                            </p>
                            <p className="text-[11px] text-gray-500 mt-0.5">
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
                        className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 flex items-center justify-between gap-2"
                      >
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {formatAgeCategoryLabel(name)}
                        </p>
                        <p className="text-lg font-bold tabular-nums text-gray-900">
                          {count}
                        </p>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-gray-200/80 shadow-sm">
          <CardContent className="p-3 sm:p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
              <div className="space-y-1 sm:col-span-2 xl:col-span-1">
                <label className="text-xs text-gray-500">Search</label>
                <Input
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  placeholder="Team, member, email, CA…"
                  className="w-full"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Competition</label>
                <select
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="">All</option>
                  {categoryNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Division</label>
                <select
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                  value={roundFilter}
                  onChange={(e) => setRoundFilter(e.target.value)}
                >
                  <option value="">All</option>
                  {roundCities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Age category</label>
                <select
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                  value={ageCategoryFilter}
                  onChange={(e) => setAgeCategoryFilter(e.target.value)}
                >
                  <option value="">All</option>
                  <option value="explorer">Explorer (Grades 05 – 08)</option>
                  <option value="innovators">
                    Innovators (Grades 09 – 12)
                  </option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Status</label>
                <select
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
              <p className="text-xs text-gray-500 mr-1 w-full sm:w-auto">
                Export {filtered.length} matching
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => runExport('csv')}
                disabled={filtered.length === 0 || exportPending}
              >
                <FileText className="w-3.5 h-3.5" />
                CSV
              </Button>
              <Button
                type="button"
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => runExport('excel')}
                disabled={filtered.length === 0 || exportPending}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Excel
              </Button>
              <Button
                type="button"
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => runExport('pdf')}
                disabled={filtered.length === 0 || exportPending}
              >
                <Download className="w-3.5 h-3.5" />
                PDF
              </Button>
              {exportPending ? (
                <span className="text-xs text-gray-500">Exporting…</span>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200/80 shadow-sm overflow-hidden w-full min-w-0">
          <CardContent className="p-0">
            <div className="w-full overflow-x-auto overscroll-x-contain">
              <Table className="min-w-[980px] w-full table-auto">
                <TableHeader className="sticky top-0 z-[1] bg-white/95 backdrop-blur shadow-sm">
                  <TableRow>
                    <TableHead className="whitespace-nowrap w-[7.5rem]">
                      Reg ID
                    </TableHead>
                    <TableHead className="whitespace-nowrap w-[6.5rem]">
                      Team No.
                    </TableHead>
                    <TableHead className="min-w-[9rem]">Team</TableHead>
                    <TableHead className="whitespace-nowrap">
                      Competition
                    </TableHead>
                    <TableHead className="whitespace-nowrap">Division</TableHead>
                    <TableHead className="min-w-[11rem]">Members</TableHead>
                    <TableHead className="min-w-[8rem]">Contact</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    <TableHead className="whitespace-nowrap">Payment</TableHead>
                    <TableHead className="whitespace-nowrap hidden 2xl:table-cell">
                      Created
                    </TableHead>
                    <TableHead className="text-right whitespace-nowrap sticky right-0 bg-white/95 backdrop-blur shadow-[-8px_0_12px_-12px_rgba(0,0,0,0.25)]">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={11}
                        className="text-center text-gray-500 py-12"
                      >
                        <p className="font-medium text-gray-700">
                          No registrations found
                        </p>
                        <p className="text-sm mt-1">
                          {filtersActive
                            ? 'Try clearing filters or adjusting search.'
                            : 'New Robofest registrations will appear here.'}
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((r) => (
                      <TableRow key={r.id} className="align-top">
                        <TableCell className="font-mono text-xs whitespace-nowrap">
                          {r.registrationId || '—'}
                        </TableCell>
                        <TableCell className="font-mono text-xs whitespace-nowrap font-semibold text-cyan-800">
                          {r.teamNumber || '—'}
                        </TableCell>
                        <TableCell className="min-w-[9rem] max-w-[14rem]">
                          <div className="font-medium leading-snug">{r.name}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1.5 flex-wrap mt-0.5">
                            <span className="truncate">{r.school || '—'}</span>
                            {r.schoolIsCustom ? (
                              <Badge
                                variant="secondary"
                                className="bg-amber-100 text-amber-800 hover:bg-amber-100 text-[10px] px-1.5 py-0"
                              >
                                Custom school
                              </Badge>
                            ) : null}
                          </div>
                          {r.ageCategory ? (
                            <Badge
                              variant="secondary"
                              className="mt-1.5 bg-violet-50 text-violet-800 hover:bg-violet-50 text-[10px] px-1.5 py-0"
                            >
                              {formatAgeCategoryLabel(r.ageCategory)}
                            </Badge>
                          ) : null}
                          {r.campusAmbassadorName ? (
                            <div className="text-[11px] text-gray-500 mt-1 line-clamp-2">
                              CA: {r.campusAmbassadorName}
                              {r.campusAmbassadorSchool
                                ? ` · ${r.campusAmbassadorSchool}`
                                : ''}
                            </div>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          {r.category}
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          {r.roundCity}
                        </TableCell>
                        <TableCell className="min-w-[11rem] max-w-[18rem]">
                          <CollapsibleTeamMembers
                            registrationId={r.id}
                            teamSize={r.teamSize}
                            members={r.teamMembers}
                          />
                        </TableCell>
                        <TableCell className="text-xs min-w-[8rem]">
                          <div className="break-all">{r.email}</div>
                          <div className="text-gray-500 whitespace-nowrap">
                            {r.phone}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={cn(
                              'capitalize border',
                              statusBadgeClass(r.status),
                            )}
                          >
                            {r.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          <div>{r.paymentStatus || '—'}</div>
                          {r.amountPaid != null ? (
                            <div className="text-gray-500">
                              BDT {r.amountPaid}
                            </div>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap hidden 2xl:table-cell">
                          {r.createdAt
                            ? format(new Date(r.createdAt), 'dd MMM yyyy HH:mm')
                            : '—'}
                        </TableCell>
                        <TableCell className="text-right sticky right-0 bg-white shadow-[-8px_0_12px_-12px_rgba(0,0,0,0.25)]">
                          <div className="flex flex-wrap justify-end gap-1">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={pending || r.status === 'confirmed'}
                              onClick={() => setStatus(r.id, 'confirmed')}
                            >
                              Confirm
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={pending || r.status === 'cancelled'}
                              onClick={() => setStatus(r.id, 'cancelled')}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={pending || !r.registrationId}
                              onClick={() => resendEmail(r.id)}
                              title={
                                (r.emailSendCount ?? 0) > 0
                                  ? `Email sent ${r.emailSendCount} time${r.emailSendCount === 1 ? '' : 's'} — click to resend to all team members`
                                  : 'Send confirmation email to all team members'
                              }
                              className="relative gap-1"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              {(r.emailSendCount ?? 0) > 0 ? (
                                <span className="inline-flex min-w-4 h-4 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold leading-none text-white">
                                  {r.emailSendCount}
                                </span>
                              ) : null}
                            </Button>
                            <Button asChild size="sm" variant="outline">
                              <a
                                href={`/api/dashboard/robofest/registrations/${r.id}/pdf`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Download confirmation PDF"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="content" className="space-y-4">
        {(message || error) && (
          <p className={`text-sm ${error ? 'text-red-600' : 'text-green-700'}`}>
            {error || message}
          </p>
        )}

        <ContentSection
          title="Event copy"
          description="Hero text, contact links, and info-strip date/venue lines."
          icon={<Trophy className="w-4 h-4 text-indigo-500" />}
          defaultOpen
          contentClassName="grid sm:grid-cols-2 gap-3"
        >
            {(
              [
                ['statusBadge', 'Status badge'],
                ['headline', 'Headline'],
                ['lead', 'Lead'],
                ['generalRulesPdf', 'General rules PDF path'],
                ['contactEmail', 'Contact email'],
                ['contactHref', 'Contact page href'],
              ] as const
            ).map(([key, label]) => (
              <div
                key={key}
                className={`space-y-1 ${key === 'lead' ? 'sm:col-span-2' : ''}`}
              >
                <label className="text-xs text-gray-500">{label}</label>
                {key === 'lead' ? (
                  <Textarea
                    value={content[key] ?? ''}
                    onChange={(e) =>
                      setContent((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    rows={2}
                  />
                ) : (
                  <Input
                    value={content[key] ?? ''}
                    onChange={(e) =>
                      setContent((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                  />
                )}
              </div>
            ))}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs text-gray-500">
                Date lines (one per line — shown in info strip)
              </label>
              <Textarea
                rows={3}
                value={(content.dateLines || []).join('\n')}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    dateLines: e.target.value
                      .split('\n')
                      .map((line) => line.trim())
                      .filter(Boolean),
                  }))
                }
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs text-gray-500">
                Venue lines (one per line — shown in info strip)
              </label>
              <Textarea
                rows={3}
                value={(content.venueLines || []).join('\n')}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    venueLines: e.target.value
                      .split('\n')
                      .map((line) => line.trim())
                      .filter(Boolean),
                  }))
                }
              />
            </div>
        </ContentSection>

        <ContentSection
          title="Contact lines"
          description="Phone contacts shown on the Robofest hub."
          contentClassName="space-y-3"
        >
            {(content.contactLines || []).map((line, index) => (
              <div
                key={index}
                className="grid sm:grid-cols-3 gap-2 border border-gray-100 rounded-lg p-3"
              >
                {(
                  [
                    ['label', 'Label'],
                    ['phone', 'Phone'],
                    ['note', 'Note'],
                  ] as const
                ).map(([field, label]) => (
                  <div key={field} className="space-y-1">
                    <label className="text-xs text-gray-500">{label}</label>
                    <Input
                      value={line[field]}
                      onChange={(e) => {
                        const value = e.target.value
                        setContent((prev) => {
                          const contactLines = [...(prev.contactLines || [])]
                          contactLines[index] = {
                            ...contactLines[index],
                            [field]: value,
                          }
                          return { ...prev, contactLines }
                        })
                      }}
                    />
                  </div>
                ))}
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setContent((prev) => ({
                    ...prev,
                    contactLines: [
                      ...(prev.contactLines || []),
                      { label: '', phone: '', note: '' },
                    ],
                  }))
                }
              >
                Add contact line
              </Button>
              {(content.contactLines || []).length > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setContent((prev) => ({
                      ...prev,
                      contactLines: (prev.contactLines || []).slice(0, -1),
                    }))
                  }
                >
                  Remove last
                </Button>
              ) : null}
            </div>
        </ContentSection>

        <ContentSection
          title="Payment"
          description="Global fee per member for bKash registration."
          contentClassName="flex flex-wrap gap-4 items-end"
        >
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={content.isPaid}
                onChange={(e) =>
                  setContent((prev) => ({ ...prev, isPaid: e.target.checked }))
                }
              />
              Paid registration (global)
            </label>
            <div className="space-y-1">
              <label className="text-xs text-gray-500">
                Fee per member (BDT)
              </label>
              <Input
                type="number"
                min={0}
                value={content.amount}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    amount: Number(e.target.value) || 0,
                  }))
                }
                className="w-36"
              />
            </div>
            <p className="text-xs text-gray-500 max-w-md">
              Charged as fee × team size via bKash. Competition per-member
              override above 0 replaces the global fee.
            </p>
        </ContentSection>

        <ContentSection
          title="Registration deadline"
          description="Public registration closes at this date and time. Leave empty for no deadline."
          contentClassName="flex flex-wrap items-end gap-3"
          defaultOpen
        >
            <div className="space-y-1 min-w-56">
              <label className="text-xs text-gray-500">Closing date</label>
              <DatePicker
                value={
                  content.registrationClosingDate
                    ? content.registrationClosingDate.slice(0, 10)
                    : ''
                }
                onChange={(date) =>
                  setContent((prev) => {
                    if (!date) {
                      return { ...prev, registrationClosingDate: null }
                    }
                    const prevTime = prev.registrationClosingDate?.includes('T')
                      ? prev.registrationClosingDate.slice(11, 16)
                      : '23:59'
                    return {
                      ...prev,
                      registrationClosingDate: `${date}T${prevTime || '23:59'}`,
                    }
                  })
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Closing time</label>
              <Input
                type="time"
                value={
                  content.registrationClosingDate?.includes('T')
                    ? content.registrationClosingDate.slice(11, 16)
                    : content.registrationClosingDate
                      ? '23:59'
                      : ''
                }
                disabled={!content.registrationClosingDate}
                onChange={(e) =>
                  setContent((prev) => {
                    const date = prev.registrationClosingDate
                      ? prev.registrationClosingDate.slice(0, 10)
                      : ''
                    if (!date) return prev
                    const time = e.target.value || '23:59'
                    return {
                      ...prev,
                      registrationClosingDate: `${date}T${time}`,
                    }
                  })
                }
                className="w-36 h-12.5"
              />
            </div>
            {content.registrationClosingDate ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setContent((prev) => ({
                    ...prev,
                    registrationClosingDate: null,
                  }))
                }
              >
                Clear deadline
              </Button>
            ) : null}
            <p className="text-xs text-gray-500 w-full">
              Shown as a live countdown on the Robofest pages. Registration closes
              at the exact date and time you set.
            </p>
        </ContentSection>

        <ContentSection
          title="Divisions / rounds"
          description="City value is the registration Division option (e.g. Dhaka, Chittagong)."
          contentClassName="space-y-4"
        >
            {content.rounds.map((round, index) => (
              <div
                key={`${round.city}-${index}`}
                className="grid sm:grid-cols-2 gap-2 border border-gray-100 rounded-lg p-3"
              >
                {(
                  [
                    ['city', 'City / division'],
                    ['title', 'Title'],
                    ['dates', 'Dates'],
                    ['venueLabel', 'Venue label'],
                    ['image', 'Image path'],
                  ] as const
                ).map(([field, label]) => (
                  <div key={field} className="space-y-1">
                    <label className="text-xs text-gray-500">{label}</label>
                    <Input
                      value={round[field]}
                      onChange={(e) => {
                        const value = e.target.value
                        setContent((prev) => {
                          const rounds = [...prev.rounds]
                          rounds[index] = { ...rounds[index], [field]: value }
                          return { ...prev, rounds }
                        })
                      }}
                    />
                  </div>
                ))}
              </div>
            ))}
        </ContentSection>

        <ContentSection
          title="Competitions"
          description="Registration categories shown on the public Robofest pages."
          contentClassName="space-y-3"
        >
            {content.categories.map((category, index) => (
              <Collapsible
                key={category.slug || index}
                className="group/cat rounded-lg border border-gray-100 overflow-hidden"
              >
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-gray-50/80 transition-colors"
                  >
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <p className="font-medium text-gray-900 truncate">
                        {category.name || `Competition ${index + 1}`}
                      </p>
                      <Badge
                        variant="secondary"
                        className={cn(
                          'text-[10px] px-1.5 py-0',
                          category.active
                            ? 'bg-emerald-50 text-emerald-800'
                            : 'bg-gray-100 text-gray-600',
                        )}
                      >
                        {category.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <ChevronDown className="w-4 h-4 shrink-0 text-gray-400 transition-transform group-data-[state=open]/cat:rotate-180" />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="border-t border-gray-100 px-3 py-3 space-y-3">
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
                      <label className="text-xs text-gray-500">{label}</label>
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
                    <label className="text-xs text-gray-500">
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
                  <label className="text-xs text-gray-500">Short description</label>
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
                  <label className="text-xs text-gray-500">About</label>
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
                  <label className="text-xs text-gray-500">
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
                  <label className="text-xs text-gray-500">Who should join</label>
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
                className="grid sm:grid-cols-3 gap-2 border border-gray-100 rounded-lg p-3"
              >
                <div className="space-y-1">
                  <label className="text-xs text-gray-500">Icon</label>
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
                  <label className="text-xs text-gray-500">Title</label>
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
                  <label className="text-xs text-gray-500">Description</label>
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

        <div className="flex flex-wrap gap-3">
          <Button type="button" onClick={saveContent} disabled={pending}>
            {pending ? 'Saving…' : 'Save content'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={resetContent}
            disabled={pending}
          >
            Reset to defaults
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  )
}
