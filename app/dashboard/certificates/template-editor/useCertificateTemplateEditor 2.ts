'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  createDefaultCertificateField,
  getSampleCertificateValues,
  getStandardCertificateFields,
  type CertificateField,
  type CertificateFieldKey,
  type CertificateTemplate,
} from '@/lib/certificate-templates'
import { updateCertificateTemplate } from '@/app/dashboard/certificates/actions'
import { clampPct } from './clampPct'
import { uploadCertificateImage } from './uploadCertificateImage'

export type CertificateTemplateEditorProps = {
  template: CertificateTemplate
  canDownload?: boolean
}

export function useCertificateTemplateEditor({
  template,
  canDownload = false,
}: CertificateTemplateEditorProps) {
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
              xPct: clampPct(xPct, -5, 100),
              yPct: clampPct(yPct, -5, 100),
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
        xPct: clampPct(x, -5, 100),
        yPct: clampPct(y, -5, 100),
      })
    } else {
      const w = drag.origW + dxPct
      updateField(drag.id, {
        wPct: clampPct(w, 2, 100),
      })
    }
  }

  const onPointerUp = () => {
    dragRef.current = null
  }

  const uploadImage = (
    file: File,
    onUrl: (url: string) => void,
    setBusy: (v: boolean) => void,
  ) =>
    uploadCertificateImage(file, onUrl, setBusy, setError)

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

  const enterPreviewMode = () => {
    setMode('preview')
    setSelectedId(null)
    dragRef.current = null
  }

  return {
    template,
    canDownload,
    pending,
    name,
    setName,
    description,
    setDescription,
    layout,
    setLayout,
    backgroundUrl,
    setBackgroundUrl,
    fields,
    selectedId,
    setSelectedId,
    mode,
    setMode,
    showSample,
    setShowSample,
    message,
    error,
    uploadingBg,
    setUploadingBg,
    uploadingSig,
    setUploadingSig,
    sampleDownloading,
    canvasRef,
    isEdit,
    selected,
    sample,
    staticFields,
    updateField,
    addField,
    resetToStandardLayout,
    removeSelected,
    removeAllFields,
    onPointerDownField,
    onPointerMove,
    onPointerUp,
    uploadImage,
    save,
    downloadSample,
    enterPreviewMode,
  }
}

export type CertificateTemplateEditorState = ReturnType<
  typeof useCertificateTemplateEditor
>
