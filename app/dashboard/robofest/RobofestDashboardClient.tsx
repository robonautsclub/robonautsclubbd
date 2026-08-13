'use client'

import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  ChevronDown,
  CreditCard,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Layers,
  Mail,
  Search,
  Trophy,
  Users,
  Award,
} from 'lucide-react'
import type {
  RobofestContent,
  RobofestRegistration,
  RobofestRegistrationStatus,
  RobofestTeamMember,
} from '@/lib/robofest-content'
import {
  ROBOFEST_MAX_CERTIFICATE_SIGNATURES,
  getDefaultCertificateSignatures,
  type RobofestCertificateSignature,
} from '@/lib/robofest-certificate-signatures'
import type { RobofestCampusAmbassador } from '@/lib/robofest-campus-ambassadors'
import {
  getActiveRobofestAwardCategories,
  nextCustomAwardCategoryId,
  ROBOFEST_CERTIFICATE_TYPES,
  ROBOFEST_DEFAULT_AWARD_CATEGORY_ID,
  type RobofestAwardAccent,
  type RobofestAwardCategory,
  type RobofestCertificateType,
} from '@/lib/robofest-award-categories'
import { formatAgeCategoryLabel } from '@/lib/robofest-registration-options'
import { cn } from '@/lib/utils'
import {
  getRobofestRegistrationsForExport,
  getRobofestRegistrationsPage,
  getRobofestRegistrationStatusCounts,
  resendRobofestRegistrationEmail,
  resetRobofestContentToDefaults,
  updateRobofestContent,
  updateRobofestMemberAwardCategory,
  updateRobofestRegistrationStatus,
} from './actions'
import type {
  RobofestRegistrationCursor,
  RobofestRegistrationStatusCounts,
} from './registrations-types'
import {
  exportRobofestCsv,
  exportRobofestExcel,
  exportRobofestPdf,
} from './exportRobofestRegistrations'
import { downloadPdfFromResponse } from '@/lib/downloadPdfBlob'
import CreateRobofestRegistrationForm from './CreateRobofestRegistrationForm'
import CampusAmbassadorsManager from './CampusAmbassadorsManager'
import CertificateTemplateSelect from '@/app/dashboard/events/CertificateTemplateSelect'
import DatePicker from '@/app/dashboard/events/DatePicker'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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

type Props = {
  initialContent: RobofestContent
  initialRegistrations: RobofestRegistration[]
  initialNextCursor: RobofestRegistrationCursor | null
  initialHasMore: boolean
  initialStatusCounts: RobofestRegistrationStatusCounts
  schools: string[]
  campusAmbassadors: RobofestCampusAmbassador[]
  canCreate?: boolean
  canEdit?: boolean
  canDelete?: boolean
  canViewPayments?: boolean
  canSendMail?: boolean
  canExportCsv?: boolean
  canExportExcel?: boolean
  canExportPdf?: boolean
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

export default function RobofestDashboardClient({
  initialContent,
  initialRegistrations,
  initialNextCursor,
  initialHasMore,
  initialStatusCounts,
  schools,
  campusAmbassadors,
  canCreate = false,
  canEdit = false,
  canDelete = false,
  canViewPayments = false,
  canSendMail = false,
  canExportCsv = false,
  canExportExcel = false,
  canExportPdf = false,
}: Props) {
  const router = useRouter()
  const [content, setContent] = useState(initialContent)
  const [pending, startTransition] = useTransition()
  const [listPending, startListTransition] = useTransition()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [uploadingSignatureId, setUploadingSignatureId] = useState<string | null>(
    null,
  )

  const [categoryFilter, setCategoryFilter] = useState('')
  const [roundFilter, setRoundFilter] = useState('')
  const [ageCategoryFilter, setAgeCategoryFilter] = useState('')
  const [statusTab, setStatusTab] =
    useState<RobofestRegistrationStatus>('pending')
  const [nameFilter, setNameFilter] = useState('')
  const [exportPending, startExportTransition] = useTransition()

  const [registrations, setRegistrations] = useState(initialRegistrations)
  const [nextCursor, setNextCursor] = useState<RobofestRegistrationCursor | null>(
    initialNextCursor,
  )
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [statusCounts, setStatusCounts] =
    useState<RobofestRegistrationStatusCounts>(initialStatusCounts)

  const statusScopedCount = statusCounts[statusTab]

  const serverFiltersActive = Boolean(
    categoryFilter || roundFilter || ageCategoryFilter,
  )
  const filtersActive = Boolean(serverFiltersActive || nameFilter.trim())

  const listFilters = useMemo(
    () => ({
      status: statusTab,
      category: categoryFilter || undefined,
      roundCity: roundFilter || undefined,
      ageCategory: ageCategoryFilter || undefined,
    }),
    [statusTab, categoryFilter, roundFilter, ageCategoryFilter],
  )

  const reloadFirstPage = (filters = listFilters) => {
    startListTransition(async () => {
      const [page, counts] = await Promise.all([
        getRobofestRegistrationsPage({ filters }),
        getRobofestRegistrationStatusCounts(),
      ])
      setRegistrations(page.items)
      setNextCursor(page.nextCursor)
      setHasMore(page.hasMore)
      setStatusCounts(counts)
    })
  }

  const skipFilterFetchRef = useRef(true)
  useEffect(() => {
    if (skipFilterFetchRef.current) {
      skipFilterFetchRef.current = false
      return
    }
    reloadFirstPage(listFilters)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch when server filters change
  }, [statusTab, categoryFilter, roundFilter, ageCategoryFilter])

  const loadMore = () => {
    if (!hasMore || !nextCursor || listPending) return
    startListTransition(async () => {
      const page = await getRobofestRegistrationsPage({
        filters: listFilters,
        cursor: nextCursor,
      })
      setRegistrations((prev) => {
        const seen = new Set(prev.map((r) => r.id))
        const appended = page.items.filter((r) => !seen.has(r.id))
        return [...prev, ...appended]
      })
      setNextCursor(page.nextCursor)
      setHasMore(page.hasMore)
    })
  }

  const filtered = useMemo(() => {
    const name = nameFilter.trim().toLowerCase()
    if (!name) return registrations
    return registrations.filter((r) => {
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
      return haystack.includes(name)
    })
  }, [registrations, nameFilter])

  const stats = useMemo(() => {
    const source = filtered
    const byCategory = new Map<string, number>()
    const byAge = new Map<string, number>()
    let paidTotal = 0
    let paidCount = 0
    let participants = 0
    for (const r of source) {
      const memberCount =
        typeof r.teamSize === 'number' && r.teamSize > 0
          ? r.teamSize
          : Array.isArray(r.teamMembers) && r.teamMembers.length > 0
            ? r.teamMembers.length
            : 1
      participants += memberCount
      byCategory.set(
        r.category,
        (byCategory.get(r.category) || 0) + memberCount,
      )
      if (r.ageCategory) {
        byAge.set(
          r.ageCategory,
          (byAge.get(r.ageCategory) || 0) + memberCount,
        )
      }
      if (r.paymentStatus === 'paid' && typeof r.amountPaid === 'number') {
        paidTotal += r.amountPaid
        paidCount += 1
      }
    }
    return {
      total: participants,
      registrations: source.length,
      byCategory: Array.from(byCategory.entries()),
      byAge: Array.from(byAge.entries()),
      paidTotal,
      paidCount,
    }
  }, [filtered])

  const clearFilters = () => {
    setCategoryFilter('')
    setRoundFilter('')
    setAgeCategoryFilter('')
    setNameFilter('')
  }

  const runExport = (kind: 'csv' | 'excel' | 'pdf') => {
    startExportTransition(() => {
      ;(async () => {
        try {
          const result = await getRobofestRegistrationsForExport(listFilters)
          if (!result.success || !result.items) {
            alert(result.error || 'Failed to load registrations for export.')
            return
          }
          let items = result.items
          const name = nameFilter.trim().toLowerCase()
          if (name) {
            items = items.filter((r) => {
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
              return haystack.includes(name)
            })
          }
          if (items.length === 0) {
            alert('No registrations to export.')
            return
          }
          const opts = { includePayments: canViewPayments }
          if (kind === 'csv') exportRobofestCsv(items, opts)
          else if (kind === 'excel') await exportRobofestExcel(items, opts)
          else await exportRobofestPdf(items, opts)
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
      reloadFirstPage()
    })
  }

  const setMemberAward = (
    registrationDocId: string,
    memberIndex: number,
    awardCategoryId: string,
  ) => {
    startTransition(async () => {
      const result = await updateRobofestMemberAwardCategory(
        registrationDocId,
        memberIndex,
        awardCategoryId,
      )
      if (!result.success) {
        alert(result.error || 'Failed to update award')
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
      setRegistrations((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                emailSent: true,
                emailSendCount: times || (r.emailSendCount ?? 0) + 1,
              }
            : r,
        ),
      )
    })
  }

  const downloadConfirmationPdf = (registration: RobofestRegistration) => {
    if (!registration.registrationId) {
      alert('Registration ID is missing.')
      return
    }
    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/dashboard/robofest/registrations/${registration.id}/pdf`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ registration, content }),
          },
        )
        await downloadPdfFromResponse(
          response,
          `Robofest-Confirmation-${registration.registrationId}.pdf`,
        )
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to download PDF')
      }
    })
  }

  const downloadMemberCertificate = (
    registration: RobofestRegistration,
    memberIndex: number,
  ) => {
    if (!registration.registrationId) {
      alert('Registration ID is missing.')
      return
    }
    if (registration.status === 'cancelled') {
      alert('Cannot generate certificates for a cancelled registration.')
      return
    }
    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/dashboard/robofest/registrations/${registration.id}/certificate`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ registration, content, memberIndex }),
          },
        )
        await downloadPdfFromResponse(
          response,
          `Robofest-Certificate-${registration.registrationId}-${memberIndex + 1}.pdf`,
        )
      } catch (err) {
        alert(
          err instanceof Error
            ? err.message
            : 'Failed to download certificate',
        )
      }
    })
  }

  const downloadBulkCertificates = () => {
    startExportTransition(async () => {
      try {
        const result = await getRobofestRegistrationsForExport(listFilters)
        if (!result.success || !result.items) {
          alert(result.error || 'Failed to load registrations for certificates.')
          return
        }
        let items = result.items
        const name = nameFilter.trim().toLowerCase()
        if (name) {
          items = items.filter((r) => {
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
            return haystack.includes(name)
          })
        }
        if (items.length === 0) {
          alert('No registrations to export.')
          return
        }
        const response = await fetch('/api/dashboard/robofest/certificates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            registrations: items,
            content,
            statusLabel: statusTab,
          }),
        })
        await downloadPdfFromResponse(
          response,
          `Robofest-Certificates-${statusTab}.pdf`,
        )
      } catch (err) {
        alert(
          err instanceof Error
            ? err.message
            : 'Failed to download certificates',
        )
      }
    })
  }

  const statusEmptyCopy: Record<
    RobofestRegistrationStatus,
    { title: string; body: string }
  > = {
    pending: {
      title: 'No pending registrations',
      body: 'New teams awaiting review will appear here.',
    },
    confirmed: {
      title: 'No confirmed registrations',
      body: 'Confirmed teams will appear here.',
    },
    cancelled: {
      title: 'No cancelled registrations',
      body: 'Cancelled team registrations will appear here.',
    },
  }

  const statusTone =
    statusTab === 'confirmed'
      ? {
          badge: 'bg-emerald-100 text-emerald-800 ring-emerald-200/80',
          bar: 'from-emerald-500 to-teal-500',
          chip: 'bg-emerald-50 text-emerald-800',
        }
      : statusTab === 'cancelled'
        ? {
            badge: 'bg-rose-100 text-rose-800 ring-rose-200/80',
            bar: 'from-rose-500 to-orange-400',
            chip: 'bg-rose-50 text-rose-800',
          }
        : {
            badge: 'bg-amber-100 text-amber-900 ring-amber-200/80',
            bar: 'from-amber-500 to-cyan-500',
            chip: 'bg-amber-50 text-amber-900',
          }

  return (
    <Tabs defaultValue="registrations" className="space-y-5 w-full min-w-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Robofest
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Local-round registrations, competition content, ambassadors, and
            exports.
          </p>
        </div>
        <TabsList className="w-full sm:w-fit shrink-0 bg-slate-100/80">
          <TabsTrigger value="registrations" className="flex-1 sm:flex-none">
            Registrations
          </TabsTrigger>
          <TabsTrigger value="content" className="flex-1 sm:flex-none">
            Content
          </TabsTrigger>
          <TabsTrigger value="ambassadors" className="flex-1 sm:flex-none">
            Ambassadors
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="registrations" className="space-y-4 w-full min-w-0">
        <Tabs
          value={statusTab}
          onValueChange={(value) =>
            setStatusTab(value as RobofestRegistrationStatus)
          }
          className="w-full space-y-4"
        >
          <TabsList className="bg-transparent border-b border-slate-200 rounded-none w-full justify-start h-auto p-0 gap-1 sm:gap-2 overflow-x-auto">
            <TabsTrigger
              value="pending"
              className="data-[state=active]:bg-amber-50 data-[state=active]:text-amber-800 data-[state=active]:border-b-2 data-[state=active]:border-amber-500 data-[state=active]:shadow-none rounded-t-lg rounded-b-none px-3 sm:px-4 py-2 text-sm font-medium border-b-2 border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            >
              Pending ({statusCounts.pending})
            </TabsTrigger>
            <TabsTrigger
              value="confirmed"
              className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-800 data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:shadow-none rounded-t-lg rounded-b-none px-3 sm:px-4 py-2 text-sm font-medium border-b-2 border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            >
              Confirmed ({statusCounts.confirmed})
            </TabsTrigger>
            <TabsTrigger
              value="cancelled"
              className="data-[state=active]:bg-rose-50 data-[state=active]:text-rose-800 data-[state=active]:border-b-2 data-[state=active]:border-rose-500 data-[state=active]:shadow-none rounded-t-lg rounded-b-none px-3 sm:px-4 py-2 text-sm font-medium border-b-2 border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            >
              Cancelled ({statusCounts.cancelled})
            </TabsTrigger>
          </TabsList>

        <div className="rounded-2xl border border-slate-200/90 bg-white/90 shadow-sm overflow-hidden">
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
                    {filtered.length}
                  </span>{' '}
                  loaded {statusTab} registration
                  {filtered.length === 1 ? '' : 's'}
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
                    onCreated={() => reloadFirstPage()}
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

          <div className="border-t border-slate-100 bg-slate-50/40 px-4 sm:px-5 py-4 space-y-3.5">
            <div className="flex items-center gap-2 text-slate-500">
              <Search className="w-3.5 h-3.5 text-cyan-700" />
              <p className="text-[11px] font-semibold uppercase tracking-wide">
                Filters & export
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                <label className="text-xs font-medium text-slate-600">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  <Input
                    value={nameFilter}
                    onChange={(e) => setNameFilter(e.target.value)}
                    placeholder="Team, member, email, CA…"
                    className="w-full pl-8 bg-white border-slate-200"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Search within loaded results — load more to include older teams.
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">
                  Competition
                </label>
                <select
                  className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
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
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">
                  Division
                </label>
                <select
                  className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
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
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">
                  Age category
                </label>
                <select
                  className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
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
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {(canExportCsv || canExportExcel || canExportPdf) ? (
                <>
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize',
                  statusTone.chip,
                )}
              >
                Export {statusTab} (server)
              </span>
              {canExportCsv ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => runExport('csv')}
                disabled={statusScopedCount === 0 || exportPending}
                className="bg-white border-slate-200"
              >
                <FileText className="w-3.5 h-3.5" />
                CSV
              </Button>
              ) : null}
              {canExportExcel ? (
              <Button
                type="button"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => runExport('excel')}
                disabled={statusScopedCount === 0 || exportPending}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Excel
              </Button>
              ) : null}
              {canExportPdf ? (
              <Button
                type="button"
                size="sm"
                className="bg-rose-600 hover:bg-rose-700 text-white"
                onClick={() => runExport('pdf')}
                disabled={statusScopedCount === 0 || exportPending}
              >
                <Download className="w-3.5 h-3.5" />
                PDF
              </Button>
              ) : null}
              {canExportPdf ? (
              <Button
                type="button"
                size="sm"
                className="bg-cyan-700 hover:bg-cyan-800 text-white"
                onClick={downloadBulkCertificates}
                disabled={statusScopedCount === 0 || exportPending}
                title="Download participation certificates for all participants in this filtered list"
              >
                <Award className="w-3.5 h-3.5" />
                Certificates
              </Button>
              ) : null}
              {exportPending ? (
                <span className="text-xs text-slate-500">Exporting…</span>
              ) : null}
                </>
              ) : null}
            </div>
          </div>
        </div>

        <Card className="border-slate-200 shadow-sm overflow-hidden w-full min-w-0">
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
                    {canViewPayments ? (
                      <TableHead className="whitespace-nowrap">Payment</TableHead>
                    ) : null}
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
                        colSpan={canViewPayments ? 11 : 10}
                        className="text-center text-slate-500 py-12"
                      >
                        <p className="font-medium text-slate-700">
                          {filtersActive
                            ? 'No registrations found'
                            : statusEmptyCopy[statusTab].title}
                        </p>
                        <p className="text-sm mt-1">
                          {filtersActive
                            ? 'Try clearing filters or adjusting search.'
                            : statusEmptyCopy[statusTab].body}
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
                          <div className="text-xs text-slate-500 flex items-center gap-1.5 flex-wrap mt-0.5">
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
                            <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">
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
                            awardCategories={content.awardCategories || []}
                            canDownloadCertificate={
                              canExportPdf &&
                              Boolean(r.registrationId) &&
                              r.status !== 'cancelled'
                            }
                            certificatePending={pending}
                            onDownloadCertificate={
                              canExportPdf
                                ? (memberIndex) =>
                                    downloadMemberCertificate(r, memberIndex)
                                : undefined
                            }
                            onAwardChange={
                              canEdit
                                ? (memberIndex, awardCategoryId) =>
                                    setMemberAward(
                                      r.id,
                                      memberIndex,
                                      awardCategoryId,
                                    )
                                : undefined
                            }
                          />
                        </TableCell>
                        <TableCell className="text-xs min-w-[8rem]">
                          <div className="break-all">{r.email}</div>
                          <div className="text-slate-500 whitespace-nowrap">
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
                        {canViewPayments ? (
                        <TableCell className="text-xs whitespace-nowrap">
                          <div>{r.paymentStatus || '—'}</div>
                          {r.amountPaid != null ? (
                            <div className="text-slate-500">
                              BDT {r.amountPaid}
                            </div>
                          ) : null}
                        </TableCell>
                        ) : null}
                        <TableCell className="text-xs whitespace-nowrap hidden 2xl:table-cell">
                          {r.createdAt
                            ? format(new Date(r.createdAt), 'dd MMM yyyy HH:mm')
                            : '—'}
                        </TableCell>
                        <TableCell className="text-right sticky right-0 bg-white shadow-[-8px_0_12px_-12px_rgba(0,0,0,0.25)]">
                          <div className="flex flex-wrap justify-end gap-1">
                            {canEdit ? (
                              <>
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
                              </>
                            ) : null}
                            {canSendMail ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={
                                pending ||
                                !r.registrationId ||
                                r.status === 'cancelled'
                              }
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
                            ) : null}
                            {canExportPdf ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={pending || !r.registrationId}
                              onClick={() => downloadConfirmationPdf(r)}
                              title="Download confirmation PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </Button>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {hasMore ? (
              <div className="border-t border-slate-100 px-4 py-3 flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={listPending}
                  onClick={loadMore}
                  className="border-slate-200"
                >
                  {listPending ? 'Loading…' : 'Load more'}
                </Button>
              </div>
            ) : null}
            {listPending && registrations.length === 0 ? (
              <p className="text-center text-sm text-slate-500 py-6">Loading registrations…</p>
            ) : null}
          </CardContent>
        </Card>
        </Tabs>
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
          icon={<Trophy className="w-4 h-4 text-cyan-500" />}
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
                <label className="text-xs text-slate-500">{label}</label>
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
              <label className="text-xs text-slate-500">
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
              <label className="text-xs text-slate-500">
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
                className="grid sm:grid-cols-3 gap-2 border border-slate-100 rounded-lg p-3"
              >
                {(
                  [
                    ['label', 'Label'],
                    ['phone', 'Phone'],
                    ['note', 'Note'],
                  ] as const
                ).map(([field, label]) => (
                  <div key={field} className="space-y-1">
                    <label className="text-xs text-slate-500">{label}</label>
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
              <label className="text-xs text-slate-500">
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
            <p className="text-xs text-slate-500 max-w-md">
              Charged as fee × team size via bKash. Competition per-member
              override above 0 replaces the global fee.
            </p>
        </ContentSection>

        <ContentSection
          title="Registration deadline"
          description="Public registration closes at this date and time in Bangladesh Standard Time (UTC+6). Leave empty for no deadline."
          contentClassName="flex flex-wrap items-end gap-3"
          defaultOpen
        >
            <div className="space-y-1 min-w-56">
              <label className="text-xs text-slate-500">Closing date</label>
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
              <label className="text-xs text-slate-500">Closing time</label>
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
            <p className="text-xs text-slate-500 w-full">
              Shown as a live countdown on the Robofest pages. Registration closes
              at the exact Bangladesh time (BST, UTC+6) you set.
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
                className="grid sm:grid-cols-2 gap-2 border border-slate-100 rounded-lg p-3"
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
                    <label className="text-xs text-slate-500">{label}</label>
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

        <ContentSection
          title="Certificate template"
          description="Optional background template from Certificates. When set, downloads use that artwork instead of the built-in Robofest design."
          icon={<Award className="w-4 h-4 text-cyan-500" />}
          contentClassName="space-y-2"
        >
          <CertificateTemplateSelect
            value={content.certificateTemplateId || ''}
            onChange={(v) =>
              setContent((prev) => ({
                ...prev,
                certificateTemplateId: v || null,
              }))
            }
            disabled={pending}
          />
        </ContentSection>

        <ContentSection
          title="Certificate signatures"
          description="Add up to 4 signatories (name, role/title, optional signature image). They auto-arrange on certificates."
          icon={<Award className="w-4 h-4 text-cyan-500" />}
          contentClassName="space-y-3"
        >
          {(() => {
            const signatures =
              content.certificateSignatures?.length
                ? content.certificateSignatures
                : getDefaultCertificateSignatures(content.hostName)

            const ensureList = (
              prev: RobofestContent,
            ): RobofestCertificateSignature[] =>
              prev.certificateSignatures?.length
                ? [...prev.certificateSignatures]
                : getDefaultCertificateSignatures(prev.hostName)

            return (
              <>
                {signatures.map((sig, index) => {
                  const updateSig = (
                    patch: Partial<RobofestCertificateSignature> & {
                      clearImage?: boolean
                    },
                  ) => {
                    setContent((prev) => {
                      const list = ensureList(prev)
                      const next = { ...list[index], ...patch }
                      if (patch.clearImage || patch.imageUrl === '') {
                        delete next.imageUrl
                        delete (next as { clearImage?: boolean }).clearImage
                      }
                      list[index] = next
                      return { ...prev, certificateSignatures: list }
                    })
                  }
                  return (
                    <div
                      key={sig.id}
                      className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-medium text-slate-600">
                          Signature {index + 1}
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200"
                          disabled={signatures.length <= 1}
                          onClick={() => {
                            setContent((prev) => ({
                              ...prev,
                              certificateSignatures: ensureList(prev).filter(
                                (s) => s.id !== sig.id,
                              ),
                            }))
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-xs text-slate-500">Name</label>
                          <Input
                            value={sig.name}
                            onChange={(e) =>
                              updateSig({ name: e.target.value })
                            }
                            placeholder="Signatory name"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-slate-500">
                            Title / position
                          </label>
                          <Input
                            value={sig.title}
                            onChange={(e) =>
                              updateSig({ title: e.target.value })
                            }
                            placeholder="e.g. Head Judge"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-slate-500">
                          Signature image (optional)
                        </label>
                        <div className="flex flex-wrap items-center gap-3">
                          {sig.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element -- remote Cloudinary preview
                            <img
                              src={sig.imageUrl}
                              alt={`${sig.name || 'Signature'} preview`}
                              className="h-12 max-w-[160px] object-contain rounded border border-slate-200 bg-white px-2"
                            />
                          ) : (
                            <span className="text-xs text-slate-400">
                              No image — blank line on certificate
                            </span>
                          )}
                          <label
                            className={cn(
                              'inline-flex h-8 cursor-pointer items-center rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50',
                              (uploadingSignatureId === sig.id || pending) &&
                                'pointer-events-none opacity-50',
                            )}
                          >
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp,image/gif"
                              className="hidden"
                              disabled={
                                uploadingSignatureId === sig.id || pending
                              }
                              onChange={async (e) => {
                                const file = e.target.files?.[0]
                                e.target.value = ''
                                if (!file) return
                                setUploadingSignatureId(sig.id)
                                setError('')
                                try {
                                  const formData = new FormData()
                                  formData.append('image', file)
                                  formData.append('folder', 'robofest')
                                  const response = await fetch(
                                    '/api/upload-image',
                                    {
                                      method: 'POST',
                                      body: formData,
                                    },
                                  )
                                  const data = await response.json()
                                  if (!response.ok) {
                                    throw new Error(
                                      data.error ||
                                        'Failed to upload signature',
                                    )
                                  }
                                  updateSig({
                                    imageUrl: data.secure_url as string,
                                  })
                                } catch (err) {
                                  setError(
                                    err instanceof Error
                                      ? err.message
                                      : 'Failed to upload signature image.',
                                  )
                                } finally {
                                  setUploadingSignatureId(null)
                                }
                              }}
                            />
                            {uploadingSignatureId === sig.id
                              ? 'Uploading…'
                              : sig.imageUrl
                                ? 'Replace image'
                                : 'Upload image'}
                          </label>
                          {sig.imageUrl ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => updateSig({ clearImage: true })}
                            >
                              Clear image
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  )
                })}

                <Button
                  type="button"
                  size="sm"
                  className="bg-cyan-700 hover:bg-cyan-800 text-white"
                  disabled={
                    signatures.length >= ROBOFEST_MAX_CERTIFICATE_SIGNATURES
                  }
                  onClick={() => {
                    setContent((prev) => {
                      const existing = ensureList(prev)
                      if (
                        existing.length >= ROBOFEST_MAX_CERTIFICATE_SIGNATURES
                      ) {
                        return prev
                      }
                      return {
                        ...prev,
                        certificateSignatures: [
                          ...existing,
                          {
                            id: `sig-${Date.now().toString(36)}`,
                            name: '',
                            title: 'Signatory',
                          },
                        ],
                      }
                    })
                  }}
                >
                  Add signature
                </Button>
              </>
            )
          })()}
        </ContentSection>

        <div className="flex flex-wrap gap-3">
          {canEdit ? (
            <>
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
            </>
          ) : (
            <p className="text-sm text-slate-500">
              View only — you do not have permission to edit Robofest content.
            </p>
          )}
        </div>
      </TabsContent>

      <TabsContent value="ambassadors" className="space-y-4 w-full min-w-0">
        <CampusAmbassadorsManager
          ambassadors={campusAmbassadors}
          canCreate={canCreate}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      </TabsContent>
    </Tabs>
  )
}
