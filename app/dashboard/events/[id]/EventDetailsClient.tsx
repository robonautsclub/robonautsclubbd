'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react'
import { format } from 'date-fns'
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Mail,
  User,
  Banknote,
  Award,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import type { Booking } from '@/types/booking'
import type { Event } from '@/types/event'
import BookingActions from './BookingActions'
import ExportBookingsButton from './ExportBookingsButton'
import CreateEventRegistrationForm from './CreateEventRegistrationForm'
import { formatEventDates, parseEventDates, isEventUpcoming } from '@/lib/dateUtils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { downloadPdfFromResponse } from '@/lib/downloadPdfBlob'
import { cn } from '@/lib/utils'
import {
  getBookings,
  getBookingsPage,
  getEventBookingStats,
} from '../../actions'
import {
  BOOKING_PAGE_SIZE_OPTIONS,
  BOOKING_DEFAULT_PAGE_SIZE,
  type BookingCursor,
  type BookingsPage,
  type EventBookingStats,
} from '../bookings-types'

const SEARCH_DEBOUNCE_MS = 300

type Props = {
  event: Event
  initialPage: BookingsPage
  initialStats: EventBookingStats
  schools?: string[]
  canEdit?: boolean
  canDelete?: boolean
  canViewPayments?: boolean
  canSendMail?: boolean
  canExportExcel?: boolean
  canExportPdf?: boolean
}

export default function EventDetailsClient({
  event,
  initialPage,
  initialStats,
  schools = [],
  canEdit = false,
  canDelete = false,
  canViewPayments = false,
  canSendMail = false,
  canExportExcel = false,
  canExportPdf = false,
}: Props) {
  const [showDetails, setShowDetails] = useState(false)
  const [nameFilter, setNameFilter] = useState('')
  const [debouncedName, setDebouncedName] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [bulkCertPending, setBulkCertPending] = useState(false)

  const [pageSize, setPageSizeState] = useState(BOOKING_DEFAULT_PAGE_SIZE)
  const [pageIndex, setPageIndex] = useState(1)
  const [cursorStack, setCursorStack] = useState<(BookingCursor | null)[]>(() =>
    initialPage.nextCursor ? [null, initialPage.nextCursor] : [null],
  )
  const [bookings, setBookings] = useState(initialPage.items)
  const [hasMore, setHasMore] = useState(initialPage.hasMore)
  const [matchedTotal, setMatchedTotal] = useState<number | null>(
    typeof initialPage.matchedTotal === 'number' ? initialPage.matchedTotal : null,
  )
  const [stats, setStats] = useState(initialStats)
  const [listPending, startListTransition] = useTransition()

  const listFetchGenRef = useRef(0)
  const cursorStackRef = useRef(cursorStack)
  cursorStackRef.current = cursorStack
  const skipFilterFetchRef = useRef(true)

  const hasCertificateTemplate = Boolean(event.certificateTemplateId?.trim())
  const eventDates = parseEventDates(event.date)

  const filtersActive = Boolean(debouncedName.trim() || categoryFilter)
  const displayTotal = matchedTotal ?? (filtersActive ? bookings.length : stats.total)

  const totalPages = useMemo(() => {
    if (matchedTotal != null) {
      return Math.max(1, Math.ceil(matchedTotal / pageSize) || 1)
    }
    if (filtersActive) return null
    return Math.max(1, Math.ceil(stats.total / pageSize) || 1)
  }, [matchedTotal, filtersActive, stats.total, pageSize])

  const showNumberedPages = totalPages != null && totalPages <= 7
  const pages = useMemo(() => {
    if (!showNumberedPages || totalPages == null) return []
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }, [showNumberedPages, totalPages])

  const categoryOptions = useMemo(() => {
    const fromEvent = (event.categories || [])
      .map((category) => category.name.trim())
      .filter(Boolean)
    const fromStats = stats.byCategory.map(([name]) => name).filter((n) => n !== 'Unspecified')
    return Array.from(new Set([...fromEvent, ...fromStats]))
  }, [event.categories, stats.byCategory])

  useEffect(() => {
    const trimmed = nameFilter.trim()
    const handle = window.setTimeout(() => {
      setDebouncedName(trimmed)
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(handle)
  }, [nameFilter])

  const applyPageResult = useCallback(
    (
      page: number,
      stack: (BookingCursor | null)[],
      result: BookingsPage,
    ) => {
      setBookings(result.items)
      setHasMore(result.hasMore)
      setPageIndex(page)
      setMatchedTotal(
        typeof result.matchedTotal === 'number' ? result.matchedTotal : null,
      )
      if (result.nextCursor) {
        setCursorStack([...stack.slice(0, page), result.nextCursor])
      } else {
        setCursorStack(stack.slice(0, page))
      }
    },
    [],
  )

  const fetchPageAt = useCallback(
    async (
      page: number,
      stack: (BookingCursor | null)[],
      size: number,
      name: string,
      category: string,
    ) => {
      const cursor = stack[page - 1] ?? null
      return getBookingsPage(event.id, {
        pageSize: size,
        cursor,
        nameFilter: name || undefined,
        categoryFilter: category || undefined,
      })
    },
    [event.id],
  )

  const goToPage = useCallback(
    (
      target: number,
      options?: {
        size?: number
        name?: string
        category?: string
        refreshStats?: boolean
      },
    ) => {
      if (target < 1) return
      const size = options?.size ?? pageSize
      const name = options?.name ?? debouncedName
      const category = options?.category ?? categoryFilter
      const refreshStats = options?.refreshStats ?? false
      const resetStack = Boolean(
        options?.size != null || options?.name != null || options?.category != null,
      )

      const maxPage = resetStack
        ? null
        : matchedTotal != null
          ? Math.max(1, Math.ceil(matchedTotal / size) || 1)
          : !name.trim() && !category
            ? Math.max(1, Math.ceil(stats.total / size) || 1)
            : null
      const boundedTarget =
        maxPage != null ? Math.min(target, maxPage) : target

      const gen = ++listFetchGenRef.current

      startListTransition(async () => {
        let stack: (BookingCursor | null)[] = resetStack
          ? [null]
          : [...cursorStackRef.current]

        while (stack.length < boundedTarget) {
          if (gen !== listFetchGenRef.current) return
          const pageNum = stack.length
          const result = await fetchPageAt(pageNum, stack, size, name, category)
          if (gen !== listFetchGenRef.current) return
          if (!result.nextCursor) {
            applyPageResult(pageNum, stack, result)
            if (refreshStats) {
              setStats(await getEventBookingStats(event.id))
            }
            return
          }
          stack = [...stack.slice(0, pageNum), result.nextCursor]
        }

        if (gen !== listFetchGenRef.current) return
        const result = await fetchPageAt(
          boundedTarget,
          stack,
          size,
          name,
          category,
        )
        if (gen !== listFetchGenRef.current) return
        applyPageResult(boundedTarget, stack, result)
        if (refreshStats) {
          setStats(await getEventBookingStats(event.id))
        }
      })
    },
    [
      pageSize,
      debouncedName,
      categoryFilter,
      matchedTotal,
      stats.total,
      fetchPageAt,
      applyPageResult,
      event.id,
    ],
  )

  const reloadCurrent = useCallback(() => {
    const gen = ++listFetchGenRef.current
    startListTransition(async () => {
      const stack = [...cursorStackRef.current]
      const [page, nextStats] = await Promise.all([
        fetchPageAt(pageIndex, stack, pageSize, debouncedName, categoryFilter),
        getEventBookingStats(event.id),
      ])
      if (gen !== listFetchGenRef.current) return
      applyPageResult(pageIndex, stack, page)
      setStats(nextStats)
    })
  }, [
    fetchPageAt,
    pageIndex,
    pageSize,
    debouncedName,
    categoryFilter,
    event.id,
    applyPageResult,
  ])

  const reloadFirstPage = useCallback(
    (name = debouncedName, category = categoryFilter) => {
      const gen = ++listFetchGenRef.current
      startListTransition(async () => {
        const [page, nextStats] = await Promise.all([
          getBookingsPage(event.id, {
            pageSize,
            nameFilter: name || undefined,
            categoryFilter: category || undefined,
          }),
          getEventBookingStats(event.id),
        ])
        if (gen !== listFetchGenRef.current) return
        applyPageResult(1, [null], page)
        setStats(nextStats)
      })
    },
    [debouncedName, categoryFilter, event.id, pageSize, applyPageResult],
  )

  useEffect(() => {
    if (skipFilterFetchRef.current) {
      skipFilterFetchRef.current = false
      return
    }
    reloadFirstPage(debouncedName, categoryFilter)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch when filters change
  }, [debouncedName, categoryFilter])

  const setPageSize = (size: number) => {
    setPageSizeState(size)
    goToPage(1, {
      size,
      name: debouncedName,
      category: categoryFilter,
    })
  }

  const goNextPage = () => {
    if (!hasMore) return
    goToPage(pageIndex + 1)
  }

  const goPrevPage = () => {
    if (pageIndex <= 1) return
    goToPage(pageIndex - 1)
  }

  const downloadBulkCertificates = async () => {
    if (!hasCertificateTemplate) {
      alert('Assign a certificate template on this event first (Edit event).')
      return
    }
    setBulkCertPending(true)
    try {
      const all = await getBookings(event.id)
      const normalizedName = debouncedName.trim().toLowerCase()
      const filtered = all.filter((booking) => {
        const matchName =
          !normalizedName || booking.name.toLowerCase().includes(normalizedName)
        const matchCategory =
          !categoryFilter || (booking.category || '') === categoryFilter
        return matchName && matchCategory
      })
      if (filtered.length === 0) {
        alert('No registrations match the current filters.')
        return
      }
      const response = await fetch(`/api/dashboard/events/${event.id}/certificates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, bookings: filtered }),
      })
      await downloadPdfFromResponse(response, `Certificates-${event.id}.pdf`)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to download certificates')
    } finally {
      setBulkCertPending(false)
    }
  }

  return (
    <>
      <Card className="shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">{event.title}</h3>
            {eventDates.length > 0 && (
              <Badge
                variant="secondary"
                className={
                  isEventUpcoming(event.date)
                    ? 'bg-green-100 text-green-800 hover:bg-green-100'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-100'
                }
              >
                {isEventUpcoming(event.date) ? 'Upcoming' : 'Past'}
              </Badge>
            )}
          </div>

          <Collapsible open={showDetails} onOpenChange={setShowDetails}>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="mb-3 text-cyan-800 bg-cyan-50 border-cyan-200 hover:bg-cyan-100 hover:text-cyan-800"
              >
                {showDetails ? 'Hide details' : 'View details'}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-cyan-50 border border-cyan-100">
                  <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5 text-cyan-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">
                      Date{eventDates.length > 1 ? 's' : ''}
                    </p>
                    <p className="font-semibold text-slate-900">
                      {formatEventDates(eventDates, 'long')}
                    </p>
                  </div>
                </div>

                {event.time && (
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 border border-blue-100">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500 mb-1">Time</p>
                      <p className="font-semibold text-slate-900">{event.time}</p>
                    </div>
                  </div>
                )}

                {(event.venue || event.location) && (
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500 mb-1">Venue</p>
                      <p className="font-semibold text-slate-900">
                        {event.venue || event.location}
                      </p>
                    </div>
                  </div>
                )}

                {event.eligibility && (
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 border border-green-100">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500 mb-1">Eligibility</p>
                      <p className="font-semibold text-slate-900">{event.eligibility}</p>
                    </div>
                  </div>
                )}

                {event.createdByName && (
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 border border-amber-100">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500 mb-1">Created By</p>
                      <p className="font-semibold text-slate-900">{event.createdByName}</p>
                      {event.createdByEmail && (
                        <p className="text-xs text-slate-500 mt-1">{event.createdByEmail}</p>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-slate-500 mb-2">Description</p>
                  <p className="text-gray-700 leading-relaxed">
                    {event.fullDescription || event.description}
                  </p>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-slate-500">Total Registrations</p>
            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-slate-500">
              {filtersActive ? 'Matched Registrations' : 'Filtered Registrations'}
            </p>
            <p className="text-2xl font-bold text-slate-900">{displayTotal}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-slate-500">Paid Registrations</p>
            <p className="text-2xl font-bold text-slate-900">
              {canViewPayments ? stats.paidCount : '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-slate-500">Money Collected</p>
            <p className="text-2xl font-bold text-green-700">
              {canViewPayments ? `BDT ${stats.totalCollected}` : '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      {stats.byCategory.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-semibold text-slate-900 mb-3">Registrations by Category</p>
            <div className="flex flex-wrap gap-2">
              {stats.byCategory.map(([category, count]) => (
                <Badge
                  key={category}
                  variant="secondary"
                  className="bg-cyan-50 text-cyan-800 border border-cyan-200 hover:bg-cyan-50"
                >
                  {category}: {count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-sm overflow-hidden p-0">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 bg-gray-50 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <h3 className="text-lg sm:text-xl font-semibold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-700" />
              Registrations
              <span className="text-xs sm:text-sm font-normal text-slate-500">
                ({displayTotal}
                {listPending ? '…' : ''})
              </span>
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              {canEdit && (
                <CreateEventRegistrationForm
                  event={event}
                  schools={schools}
                  canViewPayments={canViewPayments}
                  canSendMail={canSendMail}
                  onCreated={reloadFirstPage}
                />
              )}
              {canExportPdf && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={
                    bulkCertPending ||
                    !hasCertificateTemplate ||
                    displayTotal === 0
                  }
                  onClick={() => void downloadBulkCertificates()}
                  title={
                    hasCertificateTemplate
                      ? 'Download certificates for filtered registrations'
                      : 'Assign a certificate template on the event first'
                  }
                >
                  <Award className="w-4 h-4" />
                  {bulkCertPending ? 'Certificates…' : 'Certificates'}
                </Button>
              )}
              <ExportBookingsButton
                eventId={event.id}
                eventTitle={event.title}
                totalCount={stats.total}
                canExportExcel={canExportExcel}
                canExportPdf={canExportPdf}
                canViewPayments={canViewPayments}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              placeholder="Filter by participant name"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
            />
            {categoryOptions.length > 0 && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
              >
                <option value="">All categories</option>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {bookings.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
            </div>
            <h4 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">
              {listPending ? 'Loading registrations…' : 'No registrations found'}
            </h4>
            {!listPending && (
              <p className="text-sm sm:text-base text-slate-600">
                Try changing filters or wait for new registrations.
              </p>
            )}
          </div>
        ) : (
          <Table className="min-w-[640px]">
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="px-3 sm:px-6 py-2 sm:py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Registration ID
                </TableHead>
                <TableHead className="px-3 sm:px-6 py-2 sm:py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Name
                </TableHead>
                <TableHead className="px-3 sm:px-6 py-2 sm:py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Category
                </TableHead>
                <TableHead className="px-3 sm:px-6 py-2 sm:py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  School
                </TableHead>
                <TableHead className="px-3 sm:px-6 py-2 sm:py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Email
                </TableHead>
                <TableHead className="px-3 sm:px-6 py-2 sm:py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider hidden lg:table-cell">
                  Phone
                </TableHead>
                <TableHead className="px-3 sm:px-6 py-2 sm:py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  {canViewPayments ? 'Paid' : 'Status'}
                </TableHead>
                <TableHead className="px-3 sm:px-6 py-2 sm:py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Booked At
                </TableHead>
                <TableHead className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white">
              {bookings.map((booking) => {
                let formattedDate = 'N/A'
                if (booking.createdAt) {
                  try {
                    const bookedDate =
                      booking.createdAt instanceof Date
                        ? booking.createdAt
                        : new Date(booking.createdAt)
                    if (!isNaN(bookedDate.getTime())) {
                      formattedDate = format(bookedDate, 'MMM d, yyyy HH:mm')
                    }
                  } catch {
                    formattedDate = 'N/A'
                  }
                }
                return (
                  <TableRow key={booking.id} className="hover:bg-gray-50">
                    <TableCell className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="text-xs sm:text-sm font-mono font-semibold text-cyan-700">
                        {booking.registrationId || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="text-xs sm:text-sm font-medium text-slate-900">
                        {booking.name}
                      </div>
                    </TableCell>
                    <TableCell className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="text-xs sm:text-sm text-slate-900">
                        {booking.category || 'Unspecified'}
                      </div>
                    </TableCell>
                    <TableCell className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="text-xs sm:text-sm text-slate-900">{booking.school}</div>
                    </TableCell>
                    <TableCell className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="text-xs sm:text-sm text-slate-900 flex items-center gap-1">
                        <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                        {booking.email}
                      </div>
                    </TableCell>
                    <TableCell className="px-3 sm:px-6 py-3 sm:py-4 hidden lg:table-cell">
                      <div className="text-xs sm:text-sm text-slate-900">
                        {booking.phone || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="text-xs sm:text-sm text-slate-900">
                        {canViewPayments ? (
                          booking.paymentStatus === 'n/a' ? (
                            <span className="text-slate-600">Waived</span>
                          ) : booking.paymentStatus === 'paid' || booking.amountPaid ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="flex items-center gap-1">
                                <Banknote className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                                {booking.amountPaid != null
                                  ? `BDT ${booking.amountPaid}`
                                  : 'Paid'}
                              </span>
                              {booking.trxId ? (
                                <span className="text-[11px] text-slate-500 font-mono">
                                  {booking.trxId}
                                </span>
                              ) : null}
                            </div>
                          ) : (
                            '—'
                          )
                        ) : (
                          '—'
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="text-xs sm:text-sm text-slate-500">{formattedDate}</div>
                    </TableCell>
                    <TableCell className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                      <BookingActions
                        booking={booking}
                        event={event}
                        canCancel={canEdit || canDelete}
                        canDownloadPdf={canExportPdf}
                        canSendMail={canSendMail}
                        onChanged={reloadCurrent}
                      />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}

        <div className="border-t border-slate-100 px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="whitespace-nowrap">Show on page</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => setPageSize(Number(value))}
              disabled={listPending}
            >
              <SelectTrigger className="w-[4.5rem] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BOOKING_PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-end gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={listPending || pageIndex <= 1}
              onClick={goPrevPage}
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            {showNumberedPages ? (
              pages.map((page) => (
                <Button
                  key={page}
                  type="button"
                  variant={page === pageIndex ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    'h-8 min-w-8 px-2',
                    page === pageIndex && 'bg-cyan-700 hover:bg-cyan-800',
                  )}
                  disabled={listPending}
                  onClick={() => goToPage(page)}
                  aria-label={`Go to page ${page}`}
                >
                  {page}
                </Button>
              ))
            ) : (
              <span className="px-2 text-sm text-slate-600 tabular-nums">{pageIndex}</span>
            )}

            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={listPending || !hasMore}
              onClick={goNextPage}
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </>
  )
}
