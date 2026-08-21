'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type {
  RobofestRegistration,
  RobofestRegistrationStatus,
} from '@/lib/robofest-content'
import { downloadPdfFromResponse } from '@/lib/downloadPdfBlob'
import {
  getRobofestRegistrationsForExport,
  getRobofestRegistrationsPage,
  getRobofestRegistrationStatusCounts,
  resendRobofestRegistrationEmail,
  resetRobofestContentToDefaults,
  updateRobofestContent,
  updateRobofestMemberAwardCategory,
  updateRobofestRegistrationStatus,
} from '../actions'
import type {
  RobofestRegistrationCursor,
  RobofestRegistrationStatusCounts,
} from '../registrations-types'
import {
  exportRobofestCsv,
  exportRobofestExcel,
  exportRobofestPdf,
} from '../exportRobofestRegistrations'
import type { Props } from './types'
import {
  getStatusTone,
  registrationMatchesNameFilter,
  statusEmptyCopy,
} from './helpers'

export function useRobofestDashboard({
  initialContent,
  initialRegistrations,
  initialNextCursor,
  initialHasMore,
  initialStatusCounts,
  canViewPayments = false,
}: Pick<
  Props,
  | 'initialContent'
  | 'initialRegistrations'
  | 'initialNextCursor'
  | 'initialHasMore'
  | 'initialStatusCounts'
  | 'canViewPayments'
>) {
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
    return registrations.filter((r) => registrationMatchesNameFilter(r, name))
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
            items = items.filter((r) => registrationMatchesNameFilter(r, name))
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
          items = items.filter((r) => registrationMatchesNameFilter(r, name))
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

  const statusTone = getStatusTone(statusTab)

  return {
    content,
    setContent,
    pending,
    listPending,
    message,
    error,
    setError,
    uploadingSignatureId,
    setUploadingSignatureId,
    categoryFilter,
    setCategoryFilter,
    roundFilter,
    setRoundFilter,
    ageCategoryFilter,
    setAgeCategoryFilter,
    statusTab,
    setStatusTab,
    nameFilter,
    setNameFilter,
    exportPending,
    registrations,
    hasMore,
    statusCounts,
    statusScopedCount,
    filtersActive,
    reloadFirstPage,
    loadMore,
    filtered,
    stats,
    clearFilters,
    runExport,
    categoryNames,
    roundCities,
    saveContent,
    resetContent,
    setStatus,
    setMemberAward,
    resendEmail,
    downloadConfirmationPdf,
    downloadMemberCertificate,
    downloadBulkCertificates,
    statusEmptyCopy,
    statusTone,
    canViewPayments,
  }
}
