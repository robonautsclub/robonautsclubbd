'use client'

import { Award, Download, FileSpreadsheet, FileText, Search } from 'lucide-react'
import type { RobofestRegistrationStatus } from '@/lib/robofest-content'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { StatusTone } from './types'

export function RegistrationsToolbar({
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
  statusTab,
  statusTone,
  statusScopedCount,
  exportPending,
  canExportCsv,
  canExportExcel,
  canExportPdf,
  runExport,
  downloadBulkCertificates,
}: {
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
  statusTab: RobofestRegistrationStatus
  statusTone: StatusTone
  statusScopedCount: number
  exportPending: boolean
  canExportCsv: boolean
  canExportExcel: boolean
  canExportPdf: boolean
  runExport: (kind: 'csv' | 'excel' | 'pdf') => void
  downloadBulkCertificates: () => void
}) {
  return (
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
  )
}
