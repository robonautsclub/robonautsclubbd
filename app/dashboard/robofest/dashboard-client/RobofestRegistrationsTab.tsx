'use client'

import type {
  RobofestContent,
  RobofestRegistration,
  RobofestRegistrationStatus,
} from '@/lib/robofest-content'
import type { RobofestCampusAmbassador } from '@/lib/robofest-campus-ambassadors'
import type { RobofestRegistrationStatusCounts } from '../registrations-types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { StatusTone } from './types'
import { RegistrationsOverview } from './RegistrationsOverview'
import { RegistrationsToolbar } from './RegistrationsToolbar'
import { RegistrationsTable } from './RegistrationsTable'

type Stats = {
  total: number
  registrations: number
  byCategory: [string, number][]
  byAge: [string, number][]
  paidTotal: number
  paidCount: number
}

export function RobofestRegistrationsTab({
  statusTab,
  setStatusTab,
  statusCounts,
  statusTone,
  filtersActive,
  filtered,
  statusScopedCount,
  hasMore,
  clearFilters,
  canCreate,
  content,
  schools,
  campusAmbassadors,
  canViewPayments,
  canSendMail,
  canEdit,
  canExportCsv,
  canExportExcel,
  canExportPdf,
  reloadFirstPage,
  stats,
  nameFilter,
  setNameFilter,
  categoryFilter,
  setCategoryFilter,
  roundFilter,
  setRoundFilter,
  ageCategoryFilter,
  setAgeCategoryFilter,
  categoryNames,
  roundCities,
  exportPending,
  runExport,
  downloadBulkCertificates,
  statusEmptyCopy,
  pending,
  listPending,
  registrationsLength,
  loadMore,
  setStatus,
  setMemberAward,
  resendEmail,
  downloadConfirmationPdf,
  downloadMemberCertificate,
}: {
  statusTab: RobofestRegistrationStatus
  setStatusTab: (v: RobofestRegistrationStatus) => void
  statusCounts: RobofestRegistrationStatusCounts
  statusTone: StatusTone
  filtersActive: boolean
  filtered: RobofestRegistration[]
  statusScopedCount: number
  hasMore: boolean
  clearFilters: () => void
  canCreate: boolean
  content: RobofestContent
  schools: string[]
  campusAmbassadors: RobofestCampusAmbassador[]
  canViewPayments: boolean
  canSendMail: boolean
  canEdit: boolean
  canExportCsv: boolean
  canExportExcel: boolean
  canExportPdf: boolean
  reloadFirstPage: () => void
  stats: Stats
  nameFilter: string
  setNameFilter: (v: string) => void
  categoryFilter: string
  setCategoryFilter: (v: string) => void
  roundFilter: string
  setRoundFilter: (v: string) => void
  ageCategoryFilter: string
  setAgeCategoryFilter: (v: string) => void
  categoryNames: string[]
  roundCities: string[]
  exportPending: boolean
  runExport: (kind: 'csv' | 'excel' | 'pdf') => void
  downloadBulkCertificates: () => void
  statusEmptyCopy: Record<
    RobofestRegistrationStatus,
    { title: string; body: string }
  >
  pending: boolean
  listPending: boolean
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
          <RegistrationsOverview
            statusTab={statusTab}
            statusTone={statusTone}
            filtersActive={filtersActive}
            filteredCount={filtered.length}
            statusScopedCount={statusScopedCount}
            hasMore={hasMore}
            clearFilters={clearFilters}
            canCreate={canCreate}
            content={content}
            schools={schools}
            campusAmbassadors={campusAmbassadors}
            canViewPayments={canViewPayments}
            canSendMail={canSendMail}
            onCreated={() => reloadFirstPage()}
            stats={stats}
          />
          <RegistrationsToolbar
            nameFilter={nameFilter}
            setNameFilter={setNameFilter}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            roundFilter={roundFilter}
            setRoundFilter={setRoundFilter}
            ageCategoryFilter={ageCategoryFilter}
            setAgeCategoryFilter={setAgeCategoryFilter}
            categoryNames={categoryNames}
            roundCities={roundCities}
            statusTab={statusTab}
            statusTone={statusTone}
            statusScopedCount={statusScopedCount}
            exportPending={exportPending}
            canExportCsv={canExportCsv}
            canExportExcel={canExportExcel}
            canExportPdf={canExportPdf}
            runExport={runExport}
            downloadBulkCertificates={downloadBulkCertificates}
          />
        </div>

        <RegistrationsTable
          filtered={filtered}
          filtersActive={filtersActive}
          statusEmptyCopy={statusEmptyCopy}
          statusTab={statusTab}
          canViewPayments={canViewPayments}
          canEdit={canEdit}
          canSendMail={canSendMail}
          canExportPdf={canExportPdf}
          content={content}
          pending={pending}
          listPending={listPending}
          hasMore={hasMore}
          registrationsLength={registrationsLength}
          loadMore={loadMore}
          setStatus={setStatus}
          setMemberAward={setMemberAward}
          resendEmail={resendEmail}
          downloadConfirmationPdf={downloadConfirmationPdf}
          downloadMemberCertificate={downloadMemberCertificate}
        />
      </Tabs>
    </TabsContent>
  )
}
