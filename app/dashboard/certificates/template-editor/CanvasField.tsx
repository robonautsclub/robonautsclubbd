'use client'

import type { CertificateField } from '@/lib/certificate-templates'
import { cn } from '@/lib/utils'

type Props = {
  field: CertificateField
  isEdit: boolean
  isSelected: boolean
  previewFontPx: number
  fontFamilyCss: string
  value: string
  onPointerDownField: (
    e: React.PointerEvent,
    id: string,
    modeDrag: 'move' | 'resize',
  ) => void
}

export function CanvasField({
  field,
  isEdit,
  isSelected,
  previewFontPx,
  fontFamilyCss,
  value,
  onPointerDownField,
}: Props) {
  const isQr = field.key === 'qrVerify'
  const isSig = field.key === 'signatureImage'
  const isLogo = field.key === 'logoImage'

  return (
    <div
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
        fontFamily: fontFamilyCss,
        textAlign: field.align,
        lineHeight: 1.2,
      }}
      onPointerDown={(e) => onPointerDownField(e, field.id, 'move')}
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
          {value}
        </div>
      )}
      {isSelected ? (
        <div
          className="absolute right-0 bottom-0 h-3 w-3 translate-x-1/2 translate-y-1/2 rounded-sm bg-cyan-600 cursor-ew-resize"
          onPointerDown={(e) => onPointerDownField(e, field.id, 'resize')}
        />
      ) : null}
    </div>
  )
}
