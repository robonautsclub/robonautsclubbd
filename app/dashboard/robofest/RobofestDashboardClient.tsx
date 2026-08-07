'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Download, Mail, Trophy } from 'lucide-react'
import type {
  RobofestContent,
  RobofestRegistration,
  RobofestRegistrationStatus,
} from '@/lib/robofest-content'
import { formatAgeCategoryLabel } from '@/lib/robofest-registration-options'
import {
  resendRobofestRegistrationEmail,
  resetRobofestContentToDefaults,
  updateRobofestContent,
  updateRobofestRegistrationStatus,
} from './actions'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type Props = {
  initialContent: RobofestContent
  registrations: RobofestRegistration[]
}

function exportCsv(rows: RobofestRegistration[]) {
  const memberHeaders = [1, 2, 3, 4].flatMap((n) => [
    `Member ${n} Name`,
    `Member ${n} Email`,
    `Member ${n} Phone`,
    `Member ${n} School`,
    `Member ${n} Branch`,
    `Member ${n} Grade`,
  ])
  const headers = [
    'Registration ID',
    'Team Name',
    'Contact Email',
    'Contact Phone',
    'Contact School',
    'Age Category',
    'Team Size',
    'Campus Ambassador',
    'Ambassador School',
    'Division',
    'Competition',
    'Status',
    'Payment',
    'Amount Paid',
    'Trx ID',
    'Created At',
    'Notes',
    ...memberHeaders,
  ]
  const lines = rows.map((r) => {
    const memberCells = [0, 1, 2, 3].flatMap((i) => {
      const m = r.teamMembers?.[i]
      return [
        m?.name || '',
        m?.email || '',
        m?.phone || '',
        m?.school || '',
        m?.branch || '',
        m?.grade || '',
      ]
    })
    return [
      r.registrationId || '',
      r.name,
      r.email,
      r.phone,
      r.school,
      r.ageCategory
        ? formatAgeCategoryLabel(r.ageCategory)
        : '',
      r.teamSize ?? r.teamMembers?.length ?? '',
      r.campusAmbassadorName || '',
      r.campusAmbassadorSchool || '',
      r.roundCity,
      r.category,
      r.status,
      r.paymentStatus || '',
      r.amountPaid ?? '',
      r.trxId || '',
      r.createdAt || '',
      r.notes || '',
      ...memberCells,
    ]
      .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
      .join(',')
  })
  const blob = new Blob([[headers.join(','), ...lines].join('\n')], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `robofest-registrations-${format(new Date(), 'yyyy-MM-dd')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function RobofestDashboardClient({
  initialContent,
  registrations,
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
    const byCategory = new Map<string, number>()
    const byAge = new Map<string, number>()
    let paidTotal = 0
    let paidCount = 0
    for (const r of registrations) {
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
      byCategory: Array.from(byCategory.entries()),
      byAge: Array.from(byAge.entries()),
      paidTotal,
      paidCount,
    }
  }, [registrations])

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
      alert('Confirmation email resent.')
      router.refresh()
    })
  }

  return (
    <Tabs defaultValue="registrations" className="space-y-4">
      <TabsList>
        <TabsTrigger value="registrations">Registrations</TabsTrigger>
        <TabsTrigger value="content">Content</TabsTrigger>
      </TabsList>

      <TabsContent value="registrations" className="space-y-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 uppercase">Total</p>
              <p className="text-2xl font-bold">{registrations.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 uppercase">Paid</p>
              <p className="text-2xl font-bold">{stats.paidCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 uppercase">Collected (BDT)</p>
              <p className="text-2xl font-bold">{stats.paidTotal}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 uppercase mb-1">By competition</p>
              <ul className="text-sm text-gray-700 space-y-0.5 max-h-20 overflow-auto">
                {stats.byCategory.map(([name, count]) => (
                  <li key={name} className="flex justify-between gap-2">
                    <span className="truncate">{name}</span>
                    <span className="font-semibold">{count}</span>
                  </li>
                ))}
              </ul>
              {stats.byAge.length > 0 ? (
                <ul className="text-xs text-gray-500 space-y-0.5 mt-2 border-t border-gray-100 pt-2">
                  {stats.byAge.map(([name, count]) => (
                    <li key={name} className="flex justify-between gap-2">
                      <span className="truncate">{formatAgeCategoryLabel(name)}</span>
                      <span className="font-semibold text-gray-700">{count}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-4 flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Search</label>
              <Input
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                placeholder="Team, member, email, CA…"
                className="w-56"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Competition</label>
              <select
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
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
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
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
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                value={ageCategoryFilter}
                onChange={(e) => setAgeCategoryFilter(e.target.value)}
              >
                <option value="">All</option>
                <option value="explorer">Explorer (Grades 05 – 08)</option>
                <option value="innovators">Innovators (Grades 09 – 12)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Status</label>
              <select
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => exportCsv(filtered)}
              disabled={filtered.length === 0}
            >
              Export CSV
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reg ID</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Competition</TableHead>
                  <TableHead>Division</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-gray-500 py-8">
                      No registrations found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">
                        {r.registrationId || '—'}
                      </TableCell>
                      <TableCell className="min-w-[180px]">
                        <div className="font-medium">{r.name}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1.5 flex-wrap mt-0.5">
                          <span>{r.school || '—'}</span>
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
                          <div className="text-[11px] text-gray-500 mt-1">
                            CA: {r.campusAmbassadorName}
                            {r.campusAmbassadorSchool
                              ? ` · ${r.campusAmbassadorSchool}`
                              : ''}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell>{r.category}</TableCell>
                      <TableCell>{r.roundCity}</TableCell>
                      <TableCell className="min-w-[220px] text-xs">
                        <div className="font-medium text-gray-800 mb-1">
                          {r.teamSize || r.teamMembers?.length || 0} member
                          {(r.teamSize || r.teamMembers?.length) === 1 ? '' : 's'}
                        </div>
                        {r.teamMembers?.length ? (
                          <ul className="space-y-1.5 text-gray-600">
                            {r.teamMembers.map((m, i) => (
                              <li key={`${r.id}-m-${i}`} className="leading-snug">
                                <span className="font-medium text-gray-800">
                                  {String(i + 1).padStart(2, '0')}. {m.name}
                                </span>
                                <div className="text-[11px] text-gray-500">
                                  {[m.grade, m.school, m.branch, m.phone, m.email]
                                    .filter(Boolean)
                                    .join(' · ')}
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div>{r.email}</div>
                        <div className="text-gray-500">{r.phone}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{r.status}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div>{r.paymentStatus || '—'}</div>
                        {r.amountPaid != null ? (
                          <div className="text-gray-500">BDT {r.amountPaid}</div>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {r.createdAt
                          ? format(new Date(r.createdAt), 'dd MMM yyyy HH:mm')
                          : '—'}
                      </TableCell>
                      <TableCell className="text-right">
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
                            title="Resend email"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </Button>
                          <Button asChild size="sm" variant="outline">
                            <a
                              href={`/api/dashboard/robofest/registrations/${r.id}/pdf`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Download PDF"
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
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="content" className="space-y-4">
        {(message || error) && (
          <p className={`text-sm ${error ? 'text-red-600' : 'text-green-700'}`}>
            {error || message}
          </p>
        )}

        <Card>
          <CardHeader className="pb-2">
            <h3 className="font-semibold flex items-center gap-2">
              <Trophy className="w-4 h-4 text-indigo-500" />
              Event copy
            </h3>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-3">
            {(
              [
                ['statusBadge', 'Status badge'],
                ['headline', 'Headline'],
                ['lead', 'Lead'],
                ['dateLabel', 'Date label'],
                ['venueLabel', 'Venue label'],
                ['venueDetail', 'Venue detail'],
                ['hostName', 'Host name'],
                ['officialSite', 'Official site URL'],
                ['categoriesUrl', 'Categories URL'],
                ['contactHref', 'Contact href'],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="space-y-1 sm:col-span-1">
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
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Time label (optional)</label>
              <Input
                value={content.timeLabel ?? ''}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    timeLabel: e.target.value || null,
                  }))
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <h3 className="font-semibold">Payment</h3>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4 items-end">
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
              <label className="text-xs text-gray-500">Global fee (BDT)</label>
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
              Category-level amount overrides the global fee when set above 0.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <h3 className="font-semibold">Rounds</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            {content.rounds.map((round, index) => (
              <div
                key={`${round.city}-${index}`}
                className="grid sm:grid-cols-2 gap-2 border border-gray-100 rounded-lg p-3"
              >
                {(['city', 'title', 'dates', 'venueLabel', 'image'] as const).map(
                  (field) => (
                    <div key={field} className="space-y-1">
                      <label className="text-xs text-gray-500 capitalize">
                        {field}
                      </label>
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
                  ),
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <h3 className="font-semibold">Categories</h3>
          </CardHeader>
          <CardContent className="space-y-6">
            {content.categories.map((category, index) => (
              <div
                key={category.slug || index}
                className="border border-gray-100 rounded-lg p-4 space-y-3"
              >
                <div className="flex flex-wrap gap-3 items-center justify-between">
                  <p className="font-medium text-gray-900">
                    {category.name || `Category ${index + 1}`}
                  </p>
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
                    />
                    Active
                  </label>
                </div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {(
                    [
                      'slug',
                      'name',
                      'icon',
                      'image',
                      'skillLevel',
                      'format',
                      'rulesPdf',
                    ] as const
                  ).map((field) => (
                    <div key={field} className="space-y-1">
                      <label className="text-xs text-gray-500">{field}</label>
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
                      Category fee override (BDT, blank = use global)
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
                  <label className="text-xs text-gray-500">description</label>
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
                  <label className="text-xs text-gray-500">about</label>
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
                    highlights (one per line)
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
                  <label className="text-xs text-gray-500">whoShouldJoin</label>
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
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <h3 className="font-semibold">How it works</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            {content.howItWorks.map((step, index) => (
              <div
                key={index}
                className="grid sm:grid-cols-3 gap-2 border border-gray-100 rounded-lg p-3"
              >
                <div className="space-y-1">
                  <label className="text-xs text-gray-500">icon</label>
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
                  <label className="text-xs text-gray-500">title</label>
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
                  <label className="text-xs text-gray-500">description</label>
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
          </CardContent>
        </Card>

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
