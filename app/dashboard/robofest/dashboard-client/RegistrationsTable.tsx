'use client'

import { format } from 'date-fns'
import { Download, Mail } from 'lucide-react'
import type {
  RobofestContent,
  RobofestRegistration,
  RobofestRegistrationStatus,
} from '@/lib/robofest-content'
import { formatAgeCategoryLabel } from '@/lib/robofest-registration-options'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CollapsibleTeamMembers } from './CollapsibleTeamMembers'
import { statusBadgeClass } from './helpers'

export function RegistrationsTable({
  filtered,
  filtersActive,
  statusEmptyCopy,
  statusTab,
  canViewPayments,
  canEdit,
  canSendMail,
  canExportPdf,
  content,
  pending,
  listPending,
  hasMore,
  registrationsLength,
  loadMore,
  setStatus,
  setMemberAward,
  resendEmail,
  downloadConfirmationPdf,
  downloadMemberCertificate,
}: {
  filtered: RobofestRegistration[]
  filtersActive: boolean
  statusEmptyCopy: Record<
    RobofestRegistrationStatus,
    { title: string; body: string }
  >
  statusTab: RobofestRegistrationStatus
  canViewPayments: boolean
  canEdit: boolean
  canSendMail: boolean
  canExportPdf: boolean
  content: RobofestContent
  pending: boolean
  listPending: boolean
  hasMore: boolean
  registrationsLength: number
  loadMore: () => void
  setStatus: (id: string, status: RobofestRegistrationStatus) => void
  setMemberAward: (
    registrationDocId: string,
    memberIndex: number,
    awardCategoryId: string,
  ) => void
  resendEmail: (id: string) => void
  downloadConfirmationPdf: (registration: RobofestRegistration) => void
  downloadMemberCertificate: (
    registration: RobofestRegistration,
    memberIndex: number,
  ) => void
}) {
  return (
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
        {listPending && registrationsLength === 0 ? (
          <p className="text-center text-sm text-slate-500 py-6">Loading registrations…</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
