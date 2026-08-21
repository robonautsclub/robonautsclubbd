'use client'

import {
  certificateFontFamilyCss,
  type CertificateField,
  type CertificateTemplate,
} from '@/lib/certificate-templates'
import { cn } from '@/lib/utils'
import { A4_RATIO } from './constants'
import { displayValue } from './displayValue'
import { CanvasField } from './CanvasField'

type Props = {
  name: string
  layout: CertificateTemplate['page']['layout']
  backgroundUrl: string
  fields: CertificateField[]
  selectedId: string | null
  isEdit: boolean
  showSample: boolean
  sample: Record<string, string>
  canvasRef: React.RefObject<HTMLDivElement | null>
  mode: 'preview' | 'edit'
  onModePreview: () => void
  onModeEdit: () => void
  onShowSampleChange: (checked: boolean) => void
  onPointerMove: (e: React.PointerEvent) => void
  onPointerUp: () => void
  onCanvasPointerDown: () => void
  onPointerDownField: (
    e: React.PointerEvent,
    id: string,
    modeDrag: 'move' | 'resize',
  ) => void
}

export function CertificateCanvas({
  name,
  layout,
  backgroundUrl,
  fields,
  selectedId,
  isEdit,
  showSample,
  sample,
  canvasRef,
  mode,
  onModePreview,
  onModeEdit,
  onShowSampleChange,
  onPointerMove,
  onPointerUp,
  onCanvasPointerDown,
  onPointerDownField,
}: Props) {
  const aspect = A4_RATIO[layout]

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
          <button
            type="button"
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              mode === 'preview'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900',
            )}
            onClick={onModePreview}
          >
            PDF preview
          </button>
          <button
            type="button"
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              mode === 'edit'
                ? 'bg-cyan-700 text-white'
                : 'text-slate-600 hover:text-slate-900',
            )}
            onClick={onModeEdit}
          >
            Edit placement
          </button>
        </div>
        <label className="inline-flex items-center gap-2 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={showSample}
            onChange={(e) => onShowSampleChange(e.target.checked)}
          />
          Sample recipient data
        </label>
      </div>

      {/* PDF viewer chrome */}
      <div
        className="overflow-hidden rounded-xl border border-slate-300 bg-slate-200 shadow-sm"
        onPointerMove={isEdit ? onPointerMove : undefined}
        onPointerUp={isEdit ? onPointerUp : undefined}
        onPointerLeave={isEdit ? onPointerUp : undefined}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-300 bg-slate-100 px-3 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="truncate text-xs font-medium text-slate-700">
              {name || 'Certificate'}.pdf
            </span>
            <span className="shrink-0 rounded bg-white px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-500 border border-slate-200">
              A4 {layout}
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            {isEdit
              ? 'Drag fields to reposition · Save when done'
              : 'Page 1 of 1 · Preview only'}
          </span>
        </div>

        <div className="overflow-auto bg-[#525659] p-4 sm:p-8">
          <div
            ref={canvasRef}
            className={cn(
              'relative mx-auto bg-white select-none',
              'shadow-[0_8px_30px_rgba(0,0,0,0.35)]',
              isEdit && 'ring-1 ring-cyan-400/50',
            )}
            style={{
              width: '100%',
              maxWidth: layout === 'landscape' ? 920 : 580,
              aspectRatio: `${aspect}`,
            }}
            onPointerDown={onCanvasPointerDown}
          >
            {backgroundUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={backgroundUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-fill pointer-events-none"
                draggable={false}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
                No background
              </div>
            )}

            {fields.map((field) => {
              const isSelected = isEdit && field.id === selectedId
              // Scale pt roughly to CSS px on the preview canvas
              const previewFontPx =
                layout === 'landscape'
                  ? field.fontSizePt * 1.05
                  : field.fontSizePt * 0.95
              return (
                <CanvasField
                  key={field.id}
                  field={field}
                  isEdit={isEdit}
                  isSelected={isSelected}
                  previewFontPx={previewFontPx}
                  fontFamilyCss={certificateFontFamilyCss(field.fontFamily)}
                  value={displayValue(field, sample, showSample)}
                  onPointerDownField={onPointerDownField}
                />
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
