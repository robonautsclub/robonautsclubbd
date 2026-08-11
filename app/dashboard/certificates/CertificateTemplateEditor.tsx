'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  CERTIFICATE_DYNAMIC_FIELD_KEYS,
  CERTIFICATE_FIELD_LABELS,
  CERTIFICATE_FONT_FAMILIES,
  CERTIFICATE_FONT_FAMILY_LABELS,
  certificateFontFamilyCss,
  createDefaultCertificateField,
  getSampleCertificateValues,
  getStandardCertificateFields,
  type CertificateField,
  type CertificateFieldKey,
  type CertificateFontFamily,
  type CertificateTemplate,
} from '@/lib/certificate-templates'
import { updateCertificateTemplate } from '@/app/dashboard/certificates/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

type Props = {
  template: CertificateTemplate
}

const A4_RATIO = {
  landscape: 297 / 210,
  portrait: 210 / 297,
}

export default function CertificateTemplateEditor({ template }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [name, setName] = useState(template.name)
  const [description, setDescription] = useState(template.description || '')
  const [layout, setLayout] = useState(template.page.layout)
  const [backgroundUrl, setBackgroundUrl] = useState(template.backgroundUrl)
  const [fields, setFields] = useState<CertificateField[]>(template.fields)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mode, setMode] = useState<'preview' | 'edit'>('preview')
  const [showSample, setShowSample] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [uploadingBg, setUploadingBg] = useState(false)
  const [uploadingSig, setUploadingSig] = useState(false)
  const [sampleDownloading, setSampleDownloading] = useState(false)

  const canvasRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{
    id: string
    mode: 'move' | 'resize'
    startX: number
    startY: number
    origX: number
    origY: number
    origW: number
  } | null>(null)

  const isEdit = mode === 'edit'
  const selected = isEdit
    ? fields.find((f) => f.id === selectedId) || null
    : null
  const sample = getSampleCertificateValues()
  const staticFields = fields.filter((f) => f.key === 'staticText')

  const updateField = useCallback(
    (id: string, patch: Partial<CertificateField>) => {
      setFields((prev) =>
        prev.map((f) => (f.id === id ? { ...f, ...patch } : f)),
      )
    },
    [],
  )

  const addField = (key: CertificateFieldKey) => {
    setMode('edit')
    const field = createDefaultCertificateField(key, undefined, {
      layout,
      existing: fields,
    })
    setFields((prev) => [...prev, field])
    setSelectedId(field.id)
  }

  const resetToStandardLayout = () => {
    if (
      !confirm(
        'Replace all fields with the standard certificate layout? Custom placements will be lost.',
      )
    ) {
      return
    }
    setMode('edit')
    const next = getStandardCertificateFields(layout)
    setFields(next)
    setSelectedId(next[0]?.id ?? null)
  }

  const removeSelected = useCallback(() => {
    setSelectedId((current) => {
      if (!current) return null
      setFields((prev) => prev.filter((f) => f.id !== current))
      return null
    })
  }, [])

  const removeAllFields = () => {
    if (fields.length === 0) return
    if (!confirm('Remove all fields from this template?')) return
    setFields([])
    setSelectedId(null)
  }

  useEffect(() => {
    if (!isEdit) return
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const tag = target?.tagName?.toLowerCase()
      const typing =
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        target?.isContentEditable

      if ((e.key === 'Delete' || e.key === 'Backspace') && !typing) {
        if (!selectedId) return
        e.preventDefault()
        removeSelected()
        return
      }

      // Arrow keys: nudge selected field (Shift = 1%, else 0.1%)
      if (
        !typing &&
        selectedId &&
        (e.key === 'ArrowLeft' ||
          e.key === 'ArrowRight' ||
          e.key === 'ArrowUp' ||
          e.key === 'ArrowDown')
      ) {
        e.preventDefault()
        const step = e.shiftKey ? 1 : 0.1
        setFields((prev) =>
          prev.map((f) => {
            if (f.id !== selectedId) return f
            let xPct = f.xPct
            let yPct = f.yPct
            if (e.key === 'ArrowLeft') xPct -= step
            if (e.key === 'ArrowRight') xPct += step
            if (e.key === 'ArrowUp') yPct -= step
            if (e.key === 'ArrowDown') yPct += step
            return {
              ...f,
              xPct: Math.min(100, Math.max(-5, Math.round(xPct * 100) / 100)),
              yPct: Math.min(100, Math.max(-5, Math.round(yPct * 100) / 100)),
            }
          }),
        )
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isEdit, selectedId, removeSelected])

  const onPointerDownField = (
    e: React.PointerEvent,
    id: string,
    modeDrag: 'move' | 'resize',
  ) => {
    if (!isEdit) return
    e.stopPropagation()
    e.preventDefault()
    const field = fields.find((f) => f.id === id)
    if (!field) return
    setSelectedId(id)
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    dragRef.current = {
      id,
      mode: modeDrag,
      startX: e.clientX,
      startY: e.clientY,
      origX: field.xPct,
      origY: field.yPct,
      origW: field.wPct,
    }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current
    const canvas = canvasRef.current
    if (!drag || !canvas) return
    const rect = canvas.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return

    // Map pointer delta 1:1 to page % — no snap, high precision
    const dxPct = ((e.clientX - drag.startX) / rect.width) * 100
    const dyPct = ((e.clientY - drag.startY) / rect.height) * 100

    if (drag.mode === 'move') {
      const x = drag.origX + dxPct
      const y = drag.origY + dyPct
      updateField(drag.id, {
        xPct: Math.min(100, Math.max(-5, Math.round(x * 100) / 100)),
        yPct: Math.min(100, Math.max(-5, Math.round(y * 100) / 100)),
      })
    } else {
      const w = drag.origW + dxPct
      updateField(drag.id, {
        wPct: Math.min(100, Math.max(2, Math.round(w * 100) / 100)),
      })
    }
  }

  const onPointerUp = () => {
    dragRef.current = null
  }

  const uploadImage = async (
    file: File,
    onUrl: (url: string) => void,
    setBusy: (v: boolean) => void,
  ) => {
    setBusy(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('image', file)
      formData.append('folder', 'certificates')
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Upload failed')
      onUrl(data.secure_url as string)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setBusy(false)
    }
  }

  const save = () => {
    setMessage('')
    setError('')
    startTransition(async () => {
      const result = await updateCertificateTemplate(template.id, {
        name,
        description,
        backgroundUrl,
        page: { size: 'A4', layout },
        fields,
      })
      if (!result.success) {
        setError(result.error || 'Failed to save.')
        return
      }
      setMessage('Template saved.')
      router.refresh()
    })
  }

  const downloadSample = async () => {
    setSampleDownloading(true)
    setError('')
    try {
      // Persist latest layout first so sample matches canvas
      const saveResult = await updateCertificateTemplate(template.id, {
        name,
        description,
        backgroundUrl,
        page: { size: 'A4', layout },
        fields,
      })
      if (!saveResult.success) {
        throw new Error(saveResult.error || 'Save failed before sample')
      }
      const response = await fetch(
        `/api/dashboard/certificates/${template.id}/sample`,
        { method: 'POST' },
      )
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Sample PDF failed')
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `certificate-sample-${template.id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      setMessage('Sample PDF downloaded.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sample failed')
    } finally {
      setSampleDownloading(false)
    }
  }

  const displayValue = (field: CertificateField) => {
    if (field.key === 'staticText') {
      return field.staticValue || field.label || 'Static text'
    }
    if (field.key === 'signatureImage' || field.key === 'logoImage') return ''
    if (field.key === 'qrVerify') return ''
    if (!showSample) return `{{${field.key}}}`
    return sample[field.key] || field.label || field.key
  }

  const aspect = A4_RATIO[layout]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Edit template</h2>
          <p className="text-sm text-slate-600">
            Preview as a finished PDF page, then switch to Edit placement when you
            need to move fields.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/certificates">Back</Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={sampleDownloading || pending}
            onClick={() => void downloadSample()}
          >
            {sampleDownloading ? 'Preparing…' : 'Download sample PDF'}
          </Button>
          <Button
            type="button"
            className="bg-cyan-700 hover:bg-cyan-800 text-white"
            disabled={pending}
            onClick={save}
          >
            {pending ? 'Saving…' : 'Save template'}
          </Button>
        </div>
      </div>

      {(error || message) && (
        <p
          className={cn(
            'text-sm rounded-md px-3 py-2 border',
            error
              ? 'text-red-600 bg-red-50 border-red-100'
              : 'text-emerald-700 bg-emerald-50 border-emerald-100',
          )}
        >
          {error || message}
        </p>
      )}

      <div className="grid lg:grid-cols-[1fr_300px] gap-4 items-start">
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
                onClick={() => {
                  setMode('preview')
                  setSelectedId(null)
                  dragRef.current = null
                }}
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
                onClick={() => setMode('edit')}
              >
                Edit placement
              </button>
            </div>
            <label className="inline-flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={showSample}
                onChange={(e) => setShowSample(e.target.checked)}
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
                onPointerDown={() => {
                  if (isEdit) setSelectedId(null)
                }}
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
                  const isQr = field.key === 'qrVerify'
                  const isSig = field.key === 'signatureImage'
                  const isLogo = field.key === 'logoImage'
                  // Scale pt roughly to CSS px on the preview canvas
                  const previewFontPx =
                    layout === 'landscape'
                      ? field.fontSizePt * 1.05
                      : field.fontSizePt * 0.95
                  return (
                    <div
                      key={field.id}
                      className={cn(
                        'absolute',
                        isEdit
                          ? 'cursor-move border border-dashed'
                          : 'pointer-events-none border border-transparent',
                        isEdit && !isSelected && 'hover:border-cyan-300/80',
                        isSelected
                          ? 'border-cyan-500 ring-2 ring-cyan-400/40 z-20'
                          : 'z-10',
                      )}
                      style={{
                        left: `${field.xPct}%`,
                        top: `${field.yPct}%`,
                        width: `${field.wPct}%`,
                        color: field.color,
                        fontSize: `${previewFontPx}px`,
                        fontWeight: field.fontWeight,
                        fontFamily: certificateFontFamilyCss(field.fontFamily),
                        textAlign: field.align,
                        lineHeight: 1.2,
                      }}
                      onPointerDown={(e) =>
                        onPointerDownField(e, field.id, 'move')
                      }
                    >
                      {isQr ? (
                        <div
                          className={cn(
                            'aspect-square w-full bg-white flex items-center justify-center text-[10px] text-slate-500',
                            isEdit && 'border border-slate-300',
                            field.align === 'center' && 'mx-auto',
                            field.align === 'right' && 'ml-auto',
                          )}
                        >
                          {/* Simple QR placeholder that reads as printed */}
                          <div className="grid grid-cols-5 gap-px p-1 opacity-80 w-full h-full content-center">
                            {Array.from({ length: 25 }).map((_, i) => (
                              <span
                                key={i}
                                className={cn(
                                  'w-full aspect-square',
                                  (i * 7) % 3 === 0 ? 'bg-slate-900' : 'bg-slate-300',
                                )}
                              />
                            ))}
                          </div>
                        </div>
                      ) : isSig || isLogo ? (
                        field.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={field.imageUrl}
                            alt={isLogo ? 'Logo' : 'Signature'}
                            className={
                              isLogo
                                ? 'h-8 w-8 object-contain'
                                : 'h-10 w-full object-contain'
                            }
                            draggable={false}
                          />
                        ) : isEdit ? (
                          <div
                            className={cn(
                              'border-b border-slate-400 text-[10px] text-slate-400 flex items-end justify-center',
                              isLogo ? 'h-8 w-8 border' : 'h-10',
                            )}
                          >
                            {isLogo ? 'Logo' : 'Signature'}
                          </div>
                        ) : null
                      ) : (
                        <div className="px-0.5 break-words pointer-events-none whitespace-pre-wrap">
                          {displayValue(field)}
                        </div>
                      )}
                      {isSelected ? (
                        <div
                          className="absolute right-0 bottom-0 h-3 w-3 translate-x-1/2 translate-y-1/2 rounded-sm bg-cyan-600 cursor-ew-resize"
                          onPointerDown={(e) =>
                            onPointerDownField(e, field.id, 'resize')
                          }
                        />
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {isEdit ? (
            <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-medium text-slate-600">Add field</p>
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-xs h-7"
                    onClick={resetToStandardLayout}
                  >
                    Reset to standard layout
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-xs h-7 text-red-600 border-red-200 hover:bg-red-50"
                    disabled={fields.length === 0}
                    onClick={removeAllFields}
                  >
                    Remove all
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Dynamic (from recipient / award)
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {CERTIFICATE_DYNAMIC_FIELD_KEYS.map((key) => (
                    <Button
                      key={key}
                      type="button"
                      size="sm"
                      variant="outline"
                      className="text-xs h-7"
                      onClick={() => addField(key)}
                    >
                      {CERTIFICATE_FIELD_LABELS[key]}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Static copy
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="text-xs h-7"
                  onClick={() => addField('staticText')}
                >
                  Add appreciation / boilerplate text
                </Button>
              </div>
              {staticFields.length > 0 ? (
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                    Edit static copy
                  </p>
                  {staticFields.map((field) => (
                    <div key={field.id} className="space-y-1">
                      <button
                        type="button"
                        className={cn(
                          'text-left text-xs font-medium w-full',
                          selectedId === field.id
                            ? 'text-cyan-700'
                            : 'text-slate-600 hover:text-slate-900',
                        )}
                        onClick={() => setSelectedId(field.id)}
                      >
                        {field.label || 'Static text'}
                      </button>
                      <Textarea
                        rows={2}
                        value={field.staticValue || ''}
                        placeholder="Appreciation or intro text…"
                        onFocus={() => setSelectedId(field.id)}
                        onChange={(e) =>
                          updateField(field.id, {
                            staticValue: e.target.value,
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              ) : null}
              <p className="text-[11px] text-slate-500">
                Default positions match the built-in Robofest certificate (right
                panel + club logo). Title and position still switch from the
                recipient’s award at issue time.
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              Switch to <span className="font-medium text-slate-700">Edit placement</span>{' '}
              to drag fields, resize, or add new ones.
            </p>
          )}
        </div>

        <aside className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 sticky top-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-500">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-500">Description</label>
            <Textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-500">Layout</label>
            <select
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
              value={layout}
              onChange={(e) =>
                setLayout(
                  e.target.value === 'portrait' ? 'portrait' : 'landscape',
                )
              }
            >
              <option value="landscape">A4 Landscape</option>
              <option value="portrait">A4 Portrait</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-500">Background</label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={uploadingBg}
              onChange={(e) => {
                const file = e.target.files?.[0]
                e.target.value = ''
                if (file) {
                  void uploadImage(file, setBackgroundUrl, setUploadingBg)
                }
              }}
            />
            {uploadingBg ? (
              <p className="text-xs text-cyan-700">Uploading…</p>
            ) : null}
          </div>

          <hr className="border-slate-100" />

          {!isEdit ? (
            <div className="space-y-2">
              <p className="text-sm text-slate-600">
                You’re in PDF preview. Fields look as they will on the certificate.
              </p>
              <Button
                type="button"
                size="sm"
                className="w-full bg-cyan-700 hover:bg-cyan-800 text-white"
                onClick={() => setMode('edit')}
              >
                Edit placement
              </Button>
            </div>
          ) : selected ? (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-800">
                {CERTIFICATE_FIELD_LABELS[selected.key]}
              </p>
              {selected.key === 'staticText' ? (
                <div className="space-y-1">
                  <label className="text-xs text-slate-500">Label</label>
                  <Input
                    value={selected.label || ''}
                    onChange={(e) =>
                      updateField(selected.id, { label: e.target.value })
                    }
                  />
                  <label className="text-xs text-slate-500">Text</label>
                  <Textarea
                    rows={3}
                    value={selected.staticValue || ''}
                    onChange={(e) =>
                      updateField(selected.id, {
                        staticValue: e.target.value,
                      })
                    }
                  />
                </div>
              ) : selected.key === 'certificateTitle' ||
                selected.key === 'certificateBody' ||
                selected.key === 'awardLabel' ? (
                <p className="text-xs text-slate-500 rounded-md bg-slate-50 border border-slate-100 px-2 py-1.5">
                  Filled at issue time from the recipient’s award: Achievement +
                  position when they placed; Participation with no position
                  otherwise.
                </p>
              ) : null}
              {selected.key === 'signatureImage' ||
              selected.key === 'logoImage' ? (
                <div className="space-y-2">
                  {selected.key === 'signatureImage' ? (
                    <>
                      <div className="space-y-1">
                        <label className="text-xs text-slate-500">
                          Signatory name
                        </label>
                        <Input
                          value={selected.staticValue || ''}
                          placeholder="e.g. Dr. A. Rahman"
                          onChange={(e) =>
                            updateField(selected.id, {
                              staticValue: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-slate-500">
                          Role / title
                        </label>
                        <Input
                          value={
                            selected.label &&
                            !/^signature(\s*\d+)?$/i.test(selected.label)
                              ? selected.label
                              : ''
                          }
                          placeholder="e.g. Director"
                          onChange={(e) =>
                            updateField(selected.id, {
                              label: e.target.value || 'Signature',
                            })
                          }
                        />
                      </div>
                      <p className="text-[11px] text-slate-500">
                        For Robofest, Content → Certificate signatures fill these
                        automatically if left empty.
                      </p>
                    </>
                  ) : null}
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500">
                      {selected.key === 'logoImage'
                        ? 'Logo image'
                        : 'Signature image'}
                    </label>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      disabled={uploadingSig}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        e.target.value = ''
                        if (file) {
                          void uploadImage(
                            file,
                            (url) =>
                              updateField(selected.id, { imageUrl: url }),
                            setUploadingSig,
                          )
                        }
                      }}
                    />
                    {selected.imageUrl ? (
                      <p className="text-[11px] text-slate-500 truncate">
                        {selected.imageUrl}
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}
              {selected.key === 'qrVerify' ? (
                <div className="space-y-2">
                  <label className="text-xs text-slate-500">
                    QR size (% of page width)
                  </label>
                  <input
                    type="range"
                    min={4}
                    max={28}
                    step={0.5}
                    className="w-full"
                    value={selected.wPct}
                    onChange={(e) =>
                      updateField(selected.id, {
                        wPct: Number(e.target.value) || 8,
                      })
                    }
                  />
                  <div className="flex items-center justify-between gap-2">
                    <Input
                      type="number"
                      min={4}
                      max={28}
                      step={0.5}
                      value={Math.round(selected.wPct * 10) / 10}
                      onChange={(e) =>
                        updateField(selected.id, {
                          wPct: Math.min(
                            28,
                            Math.max(4, Number(e.target.value) || 8),
                          ),
                        })
                      }
                    />
                    <span className="text-xs text-slate-500 shrink-0">
                      Drag the handle on the canvas to resize too
                    </span>
                  </div>
                </div>
              ) : null}
              {selected.key !== 'qrVerify' &&
              selected.key !== 'signatureImage' &&
              selected.key !== 'logoImage' ? (
                <>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500">Font</label>
                    <select
                      className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm"
                      value={selected.fontFamily || 'Helvetica'}
                      onChange={(e) =>
                        updateField(selected.id, {
                          fontFamily: e.target.value as CertificateFontFamily,
                        })
                      }
                    >
                      {CERTIFICATE_FONT_FAMILIES.map((family) => (
                        <option key={family} value={family}>
                          {CERTIFICATE_FONT_FAMILY_LABELS[family]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-500">
                        Font size (pt)
                      </label>
                      <Input
                        type="number"
                        min={6}
                        max={72}
                        value={selected.fontSizePt}
                        onChange={(e) =>
                          updateField(selected.id, {
                            fontSizePt: Number(e.target.value) || 12,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-500">Weight</label>
                      <select
                        className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm"
                        value={selected.fontWeight}
                        onChange={(e) =>
                          updateField(selected.id, {
                            fontWeight:
                              e.target.value === 'bold' ? 'bold' : 'normal',
                          })
                        }
                      >
                        <option value="normal">Normal</option>
                        <option value="bold">Bold</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-500">Color</label>
                      <Input
                        type="color"
                        value={selected.color}
                        onChange={(e) =>
                          updateField(selected.id, { color: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-500">Align</label>
                      <select
                        className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm"
                        value={selected.align}
                        onChange={(e) =>
                          updateField(selected.id, {
                            align: e.target.value as CertificateField['align'],
                          })
                        }
                      >
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                      </select>
                    </div>
                  </div>
                </>
              ) : null}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-xs text-slate-500">X%</label>
                  <Input
                    type="number"
                    step={0.01}
                    value={Number(selected.xPct.toFixed(2))}
                    onChange={(e) =>
                      updateField(selected.id, {
                        xPct: Number(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500">Y%</label>
                  <Input
                    type="number"
                    step={0.01}
                    value={Number(selected.yPct.toFixed(2))}
                    onChange={(e) =>
                      updateField(selected.id, {
                        yPct: Number(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500">W%</label>
                  <Input
                    type="number"
                    step={0.01}
                    value={Number(selected.wPct.toFixed(2))}
                    onChange={(e) =>
                      updateField(selected.id, {
                        wPct: Number(e.target.value) || 10,
                      })
                    }
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                Drag freely, or use arrow keys (0.1%) — hold Shift for 1%
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="text-red-600 border-red-200 w-full"
                onClick={removeSelected}
              >
                Remove field
              </Button>
              <p className="text-[11px] text-slate-500">
                Or press Delete / Backspace
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Select a field on the canvas to edit its style.
            </p>
          )}
        </aside>
      </div>
    </div>
  )
}
