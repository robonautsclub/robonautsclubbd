'use client'

import CampusAmbassadorsManager from './CampusAmbassadorsManager'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Props } from './dashboard-client/types'
import { useRobofestDashboard } from './dashboard-client/useRobofestDashboard'
import { RobofestRegistrationsTab } from './dashboard-client/RobofestRegistrationsTab'
import { RobofestContentTab } from './dashboard-client/RobofestContentTab'

export type { Props }

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
  const d = useRobofestDashboard({
    initialContent,
    initialRegistrations,
    initialNextCursor,
    initialHasMore,
    initialStatusCounts,
    canViewPayments,
  })

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

      <RobofestRegistrationsTab
        statusTab={d.statusTab}
        setStatusTab={d.setStatusTab}
        statusCounts={d.statusCounts}
        statusTone={d.statusTone}
        filtersActive={d.filtersActive}
        filtered={d.filtered}
        statusScopedCount={d.statusScopedCount}
        hasMore={d.hasMore}
        clearFilters={d.clearFilters}
        canCreate={canCreate}
        content={d.content}
        schools={schools}
        campusAmbassadors={campusAmbassadors}
        canViewPayments={canViewPayments}
        canSendMail={canSendMail}
        canEdit={canEdit}
        canExportCsv={canExportCsv}
        canExportExcel={canExportExcel}
        canExportPdf={canExportPdf}
        reloadFirstPage={d.reloadFirstPage}
        stats={d.stats}
        nameFilter={d.nameFilter}
        setNameFilter={d.setNameFilter}
        categoryFilter={d.categoryFilter}
        setCategoryFilter={d.setCategoryFilter}
        roundFilter={d.roundFilter}
        setRoundFilter={d.setRoundFilter}
        ageCategoryFilter={d.ageCategoryFilter}
        setAgeCategoryFilter={d.setAgeCategoryFilter}
        categoryNames={d.categoryNames}
        roundCities={d.roundCities}
        exportPending={d.exportPending}
        runExport={d.runExport}
        downloadBulkCertificates={d.downloadBulkCertificates}
        statusEmptyCopy={d.statusEmptyCopy}
        pending={d.pending}
        listPending={d.listPending}
        registrationsLength={d.registrations.length}
        loadMore={d.loadMore}
        setStatus={d.setStatus}
        setMemberAward={d.setMemberAward}
        resendEmail={d.resendEmail}
        downloadConfirmationPdf={d.downloadConfirmationPdf}
        downloadMemberCertificate={d.downloadMemberCertificate}
      />

      <RobofestContentTab
        message={d.message}
        error={d.error}
        content={d.content}
        setContent={d.setContent}
        pending={d.pending}
        canEdit={canEdit}
        saveContent={d.saveContent}
        resetContent={d.resetContent}
        uploadingSignatureId={d.uploadingSignatureId}
        setUploadingSignatureId={d.setUploadingSignatureId}
        setError={d.setError}
      />

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
