'use client'

import { useState } from 'react'
import {
  Award,
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
  Search,
} from 'lucide-react'
import type { RobofestRegistrationStatus } from '@/lib/robofest-content'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
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
  const [exportOpen, setExportOpen] = useState(false)
  const canExport = canExportCsv || canExportExcel || canExportPdf
  const exportDisabled = statusScopedCount === 0 || exportPending

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
            Searches all {statusTab} registrations (not just this page).
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
        {canExport ? (
          <>
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize',
                statusTone.chip,
              )}
            >
              Export {statusTab}
            </span>
            <Popover open={exportOpen} onOpenChange={setExportOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={exportDisabled}
                  className="bg-white border-slate-200 gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  {exportPending ? 'Exporting…' : 'Export'}
                  <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-52 p-1">
                <div className="flex flex-col">
                  {canExportCsv ? (
                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-slate-700 hover:bg-slate-100 text-left disabled:opacity-50"
                      disabled={exportDisabled}
                      onClick={() => {
                        setExportOpen(false)
                        runExport('csv')
                      }}
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      CSV
                    </button>
                  ) : null}
                  {canExportExcel ? (
                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-slate-700 hover:bg-slate-100 text-left disabled:opacity-50"
                      disabled={exportDisabled}
                      onClick={() => {
                        setExportOpen(false)
                        runExport('excel')
                      }}
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      Excel
                    </button>
                  ) : null}
                  {canExportPdf ? (
                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-slate-700 hover:bg-slate-100 text-left disabled:opacity-50"
                      disabled={exportDisabled}
                      onClick={() => {
                        setExportOpen(false)
                        runExport('pdf')
                      }}
                    >
                      <Download className="w-3.5 h-3.5 text-rose-600" />
                      PDF
                    </button>
                  ) : null}
                  {canExportPdf ? (
                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-slate-700 hover:bg-slate-100 text-left disabled:opacity-50 border-t border-slate-100 mt-0.5 pt-2"
                      disabled={exportDisabled}
                      title="Download participation certificates for all participants in this filtered list"
                      onClick={() => {
                        setExportOpen(false)
                        downloadBulkCertificates()
                      }}
                    >
                      <Award className="w-3.5 h-3.5 text-cyan-700" />
                      Certificates
                    </button>
                  ) : null}
                </div>
              </PopoverContent>
            </Popover>
          </>
        ) : null}
      </div>
    </div>
  )
}
